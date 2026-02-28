<template>
    <div>
        <Views :loading="loading" :error="error" />

        <v-tabs :value="tab" height="40" show-arrows slider-size="2" class="px-4 pb-2">
            <v-tab v-for="t in tabs" :key="t.id" :to="{ params: { id: t.id } }" :tab-value="t.id" exact>
                {{ t.name }}
            </v-tab>
        </v-tabs>

        <template v-if="!error">
            <template v-if="!tab">
                <div class="pt-4">
                    <Logs
                        :show-sources="false"
                        :default-filters="[{ name: 'service.name', op: '=', value: 'KubernetesEvents' }]"
                        :hidden-attributes="['service.name']"
                        :columns="[
                            { key: 'date', label: '日期' },
                            { key: 'cluster', label: '集群', maxWidth: 20 },
                            { key: 'object.namespace', label: '命名空间', maxWidth: 20 },
                            { key: 'object.name', label: '对象', maxWidth: 20 },
                            { key: 'object.kind', label: '类型' },
                            { key: 'message', label: '消息' },
                        ]"
                        @loading="setLoading"
                        @error="setError"
                    />
                </div>
            </template>
            <template v-else-if="tab === 'fluxcd'">
                <div class="pt-4">
                    <FluxCD @loading="setLoading" @error="setError" />
                </div>
            </template>
            <template v-else-if="tab === 'rollouts'">
                <div class="pt-4">
                    <Deployments @loading="setLoading" @error="setError" />
                </div>
            </template>
        </template>
    </div>
</template>

<script>
import Views from '@/views/Views.vue';
import Deployments from '@/views/Deployments.vue';
import Logs from '@/components/Logs.vue';
import FluxCD from '@/components/FluxCD.vue';

export default {
    components: { Deployments, Views, Logs, FluxCD },
    data() {
        return {
            tab: this.$route.params.id,
            error: '',
            loading: false,
        };
    },
    mounted() {
        if (!this.tabs.find((t) => t.id === this.tab)) {
            if (this.$route.params.id) {
                this.$router.replace({ params: { id: undefined } });
            }
        }
    },
    watch: {
        '$route.params.id'(newId) {
            this.tab = newId;
            this.error = '';
        },
    },
    computed: {
        tabs() {
            let tabs = [
                { id: undefined, name: '事件' },
                { id: 'fluxcd', name: 'FluxCD' },
                { id: 'rollouts', name: '滚动更新' },
            ];
            if (this.$api.context && this.$api.context.fluxcd === false) {
                tabs = tabs.filter((tab) => tab.id !== 'fluxcd');
            }

            return tabs;
        },
    },

    methods: {
        setLoading(loading) {
            this.loading = loading;
        },
        setError(error) {
            this.error = error;
        },
    },
};
</script>

<style scoped></style>
