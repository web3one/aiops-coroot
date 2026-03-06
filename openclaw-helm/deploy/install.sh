#!/bin/bash

# 退出脚本如果任何命令执行失败，未定义变量也报错
set -euo pipefail

# 获取当前脚本所在的绝对路径，并推导本地 Chart 目录位置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$SCRIPT_DIR/../charts/openclaw"

# 定义部署使用的变量
NAMESPACE="aiops-openclaw"
RELEASE_NAME="openclaw"
# 优先读取环境变量，如果没有设置则使用默认值
API_KEY="${OPENAI_API_KEY:-sk-sp-02d8649d6e224881a6df2d85a3eb27d4}"
API_BASE_URL="${OPENAI_BASE_URL:-https://coding.dashscope.aliyuncs.com/v1}"
GATEWAY_TOKEN="${OPENCLAW_GATEWAY_TOKEN:-aiops2026}"
PRIMARY_MODEL_RAW="${OPENCLAW_PRIMARY_MODEL:-qwen3.5-plus}"
TRUSTED_PROXIES_RAW="${OPENCLAW_TRUSTED_PROXIES:-}"
# OpenClaw 运行时需要 provider/model 形式；openai provider 会负责路由到 OpenAI 兼容后端。
if [[ "$PRIMARY_MODEL_RAW" == */* ]]; then
    PRIMARY_MODEL="$PRIMARY_MODEL_RAW"
else
    PRIMARY_MODEL="openai/$PRIMARY_MODEL_RAW"
fi

discover_trusted_proxies() {
    if [[ -n "$TRUSTED_PROXIES_RAW" ]]; then
        tr ',' '\n' <<<"$TRUSTED_PROXIES_RAW" | sed '/^[[:space:]]*$/d' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
        return 0
    fi

    kubectl get pods -A \
      -l app.kubernetes.io/component=controller \
      -o jsonpath='{range .items[*]}{.metadata.labels.app\.kubernetes\.io/name}{"\t"}{.status.podIP}{"\n"}{end}' 2>/dev/null \
      | awk -F '\t' '$1 == "ingress-nginx" && $2 != "" {print $2}' \
      | sort -u
}

TRUSTED_PROXIES_LIST="$(discover_trusted_proxies || true)"
TRUSTED_PROXIES_JSON="[]"
if [[ -n "$TRUSTED_PROXIES_LIST" ]]; then
    mapfile -t TRUSTED_PROXIES_ARRAY <<<"$TRUSTED_PROXIES_LIST"
    TRUSTED_PROXIES_JSON="["
    for ip in "${TRUSTED_PROXIES_ARRAY[@]}"; do
        [[ -z "$ip" ]] && continue
        if [[ "$TRUSTED_PROXIES_JSON" != "[" ]]; then
            TRUSTED_PROXIES_JSON+=", "
        fi
        TRUSTED_PROXIES_JSON+="\"$ip\""
    done
    TRUSTED_PROXIES_JSON+="]"
fi

echo "=== 开始部署 OpenClaw ==="
if [[ "$TRUSTED_PROXIES_JSON" == "[]" ]]; then
    echo "警告：未自动发现 ingress-nginx controller Pod IP；trustedProxies 将保持为空。"
    echo "      如需通过外部 Ingress 访问，请设置 OPENCLAW_TRUSTED_PROXIES=ip1,ip2 或在 values 中配置 app-template.gateway.trustedProxies。"
else
    echo "检测到 trustedProxies: $TRUSTED_PROXIES_JSON"
fi

print_debug_info() {
    echo "=== 部署失败诊断信息开始 ==="
    kubectl get pods -n "$NAMESPACE" -o wide || true
    kubectl get pvc -n "$NAMESPACE" -o wide || true
    kubectl get events -n "$NAMESPACE" --sort-by=.lastTimestamp | tail -n 50 || true
    echo "=== 部署失败诊断信息结束 ==="
}

# 1. 检查本地 Chart 目录并更新依赖
echo "[1/5] 正在检查本地 Helm Chart并更新依赖..."
if [ ! -d "$CHART_DIR" ]; then
    echo "错误：未找到本地 Chart 目录 '$CHART_DIR'！"
    exit 1
fi
# 优先使用本地依赖包，离线环境下避免因仓库不可达而失败
if ! helm dependency build "$CHART_DIR"; then
    if ls "$CHART_DIR"/charts/*.tgz >/dev/null 2>&1; then
        echo "警告：无法在线刷新 Helm 依赖，继续使用本地缓存的 charts/*.tgz。"
    else
        echo "错误：Helm 依赖构建失败，且本地不存在可用的 charts/*.tgz。"
        echo "请检查网络/DNS，或先手动执行: helm dependency update \"$CHART_DIR\""
        exit 1
    fi
fi

# 2. 创建用于部署的 Kubernetes 命名空间（如果它不存在的话）
echo "[2/5] 正在准备命名空间 '$NAMESPACE'..."
if ! kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    # 命名空间不存在，创建它
    kubectl create namespace "$NAMESPACE"
    echo "命名空间 '$NAMESPACE' 已创建。"
else
    # 命名空间已经存在，无需操作
    echo "命名空间 '$NAMESPACE' 已存在。"
fi

# 3. 创建或更新运行应用所需的 Secret (敏感信息)
echo "[3/5] 正在配置应用密钥 (Secret)..."
# 首先尝试删除旧的 secret（如果存在旧的，避免重复创建报错），然后重建
kubectl delete secret openclaw-env-secret -n "$NAMESPACE" --ignore-not-found
# 将 API Key 和 Gateway Token 储存在 Secret 里，供内部容器挂载使用
kubectl create secret generic openclaw-env-secret -n "$NAMESPACE" \
  --from-literal=OPENAI_API_KEY="$API_KEY" \
  --from-literal=OPENAI_BASE_URL="$API_BASE_URL" \
  --from-literal=OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN" \
  --from-literal=OPENCLAW_PRIMARY_MODEL="$PRIMARY_MODEL"
echo "应用密钥已配置完成。"


# 5. 使用 Helm 安装或升级 Release
echo "[5/5] 正在使用本地 Chart 安装/升级 OpenClaw..."
# upgrade --install 表示如果不存在则安装，如果已存在则更新配置
if ! helm upgrade --install "$RELEASE_NAME" "$CHART_DIR" -n "$NAMESPACE" \
    --reset-values \
    --set-json "app-template.gateway.trustedProxies=$TRUSTED_PROXIES_JSON" \
    --wait --timeout 10m --atomic; then
    print_debug_info
    exit 1
fi

echo "[6/6] 正在重启 Deployment 以加载最新 Secret 环境变量..."
kubectl rollout restart deployment/"$RELEASE_NAME" -n "$NAMESPACE"
kubectl rollout status deployment/"$RELEASE_NAME" -n "$NAMESPACE" --timeout=10m

echo "=== 部署完成 ==="
echo "部署操作提示："
echo "1. 你可以通过执行以下命令来进行端口转发，以便在本地访问 Web UI："
echo "   kubectl port-forward -n $NAMESPACE svc/$RELEASE_NAME 18789:18789"
echo "2. 要批准设备配对请求，请另开一个终端执行："
echo "   kubectl exec -n $NAMESPACE deployment/$RELEASE_NAME -c main -- node dist/index.js devices list"
echo "   kubectl exec -n $NAMESPACE deployment/$RELEASE_NAME -c main -- node dist/index.js devices approve <REQUEST_ID>"
