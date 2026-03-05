#!/bin/bash

# 退出脚本如果任何命令执行失败，未定义变量也报错
set -euo pipefail

# 获取当前脚本所在的绝对路径，并推导本地 Chart 目录位置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHART_DIR="$SCRIPT_DIR/../charts/openclaw"

# 定义部署使用的变量
NAMESPACE="aiops-openclaw"
RELEASE_NAME="openclaw"
# 优先读取环境变量，如果没有设置则使用占位符
API_KEY=${DOUBAO_API_KEY:-"f1370e73-7700-45f3-9baa-df96ecedf88f"}
GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN:-"aiops2026"}

echo "=== 开始部署 OpenClaw ==="

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
# 更新本地 Chart 依赖的其它的 subchart (例如 app-template)
helm dependency update "$CHART_DIR"

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
  --from-literal=OPENAI_BASE_URL="https://ark.cn-beijing.volces.com/api/v3" \
  --from-literal=OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN"
echo "应用密钥已配置完成。"


# 5. 使用 Helm 安装或升级 Release
echo "[5/5] 正在使用本地 Chart 安装/升级 OpenClaw..."
# upgrade --install 表示如果不存在则安装，如果已存在则更新配置
if ! helm upgrade --install "$RELEASE_NAME" "$CHART_DIR" -n "$NAMESPACE" --wait --timeout 10m --atomic; then
    print_debug_info
    exit 1
fi

echo "=== 部署完成 ==="
echo "部署操作提示："
echo "1. 你可以通过执行以下命令来进行端口转发，以便在本地访问 Web UI："
echo "   kubectl port-forward -n $NAMESPACE svc/$RELEASE_NAME 18789:18789"
echo "2. 要批准设备配对请求，请另开一个终端执行："
echo "   kubectl exec -n $NAMESPACE deployment/$RELEASE_NAME -c main -- node dist/index.js devices list"
echo "   kubectl exec -n $NAMESPACE deployment/$RELEASE_NAME -c main -- node dist/index.js devices approve <REQUEST_ID>"
