<template>
    <Views :loading="loading" :error="error">
        <v-alert v-if="!loading && !error && !nodes.length" color="info" outlined text>
            Coroot 目前支持运行在 AWS、GCP 和 Azure 上的服务的成本监控。每个节点上的 agent 需要访问云元数据服务，以获取实例元数据，例如区域、可用区和实例类型。
        </v-alert>

        <v-alert v-if="custom_pricing" color="info" outlined text>
            节点要么不在支持的云平台中，要么 agent 无法访问云元数据。<br />
            在这种情况下，将使用自定义定价，您可以调整每核 vCPU 和每 GB 内存的价格。
            <CustomCloudPricing />
        </v-alert>

        <NodesCosts v-if="nodes.length" :nodes="nodes" />
        <ApplicationsCosts v-if="applications.length" :applications="applications" />
    </Views>
</template>

<script>
import Views from '@/views/Views.vue';
import NodesCosts from '@/components/NodesCosts.vue';
import ApplicationsCosts from '@/components/ApplicationsCosts.vue';
import CustomCloudPricing from '@/components/CustomCloudPricing.vue';

export default {
    components: { Views, ApplicationsCosts, NodesCosts, CustomCloudPricing },

    data() {
        return {
            nodes: [],
            applications: [],
            loading: false,
            error: '',
            custom_pricing: false,
        };
    },

    mounted() {
        this.get();
        this.$events.watch(this, this.get, 'refresh');
    },

    methods: {
        get() {
            this.loading = true;
            this.error = '';
            this.$api.getOverview('costs', '', (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.custom_pricing = data.costs.custom_pricing;
                this.nodes = data.costs.nodes || [];
                this.applications = data.costs.applications || [];
            });
        },
    },
};
</script>
