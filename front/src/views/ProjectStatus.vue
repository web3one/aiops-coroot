<template>
    <div style="max-width: 800px">
        <h2 class="text-h5 mt-10 mb-5">状态</h2>
        <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text>
            {{ error }}
        </v-alert>
        <div v-if="status">
            <div class="d-flex flex-nowrap">
                <Led :status="status.prometheus.status" />
                <div>
                    <span class="font-weight-medium">prometheus</span>:
                    <template v-if="status.prometheus.error">
                        {{ status.prometheus.error }}
                    </template>
                    <template v-else>
                        {{ status.prometheus.message }}
                    </template>
                    <router-link v-if="status.prometheus.action === 'configure'" :to="{ params: { tab: 'prometheus' } }">配置</router-link>
                </div>
            </div>

            <div class="d-flex align-center mt-2">
                <Led :status="status.node_agent.status" />
                <span class="font-weight-medium">coroot-node-agent</span>:
                <span class="ml-1 mr-2">
                    <template v-if="status.node_agent.status === 'unknown'"> 未知 </template>
                    <template v-else>
                        <template v-if="status.node_agent.nodes"> 发现 {{ status.node_agent.nodes }} 个节点 </template>
                        <template v-else>
                            <template v-if="loading">正在检查...</template>
                            <template v-else>未安装 Agent</template>
                        </template>
                    </template>
                </span>
                <AgentInstallation color="primary" small>安装</AgentInstallation>
            </div>

            <div v-if="status.kube_state_metrics" class="d-flex align-center mt-2">
                <Led :status="status.kube_state_metrics.status" />
                <span class="font-weight-medium">kube-state-metrics</span>:
                <template v-if="status.kube_state_metrics.status === 'ok'">
                    发现 {{ status.kube_state_metrics.applications }} 个应用
                </template>
                <template v-else>
                    <template v-if="loading">正在检查...</template>
                    <template v-else>未安装 kube-state-metrics</template>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import Led from '../components/Led.vue';
import AgentInstallation from './AgentInstallation.vue';

export default {
    props: {
        projectId: String,
    },

    components: { Led, AgentInstallation },

    data() {
        return {
            status: null,
            error: null,
            loading: false,
        };
    },

    mounted() {
        this.get();
    },

    watch: {
        projectId() {
            this.status = null;
            this.get();
        },
    },

    methods: {
        get() {
            if (!this.projectId) {
                return;
            }
            this.loading = true;
            this.$api.getStatus((data, error) => {
                setTimeout(() => {
                    this.loading = false;
                }, 500);
                if (error) {
                    this.error = error;
                    this.status = null;
                    return;
                }
                this.status = data;
                if (this.status.error) {
                    this.error = this.status.error;
                    this.status = null;
                }
            });
        },
    },
};
</script>

<style scoped>
.muted {
    color: grey;
}
</style>
