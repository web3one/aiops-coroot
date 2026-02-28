<template>
    <v-dialog v-model="dialog" persistent no-click-animation max-width="80%">
        <v-card class="pa-4">
            <div class="d-flex align-center font-weight-medium mb-2 text-h5">
                <div class="text-capitalize">{{ action === 'add' ? '添加' : '编辑' }}面板</div>
                <v-spacer />
                <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
            </div>
            <v-form v-model="valid">
                <v-row dense>
                    <v-col cols="8">
                        <div class="subtitle-1">名称</div>
                        <v-text-field v-model="config.name" :rules="[$validators.notEmpty]" outlined dense hide-details />
                    </v-col>
                    <v-col>
                        <div class="subtitle-1">分组</div>
                        <v-combobox
                            v-model="panel.group"
                            :items="groups_"
                            :search-input.sync="search"
                            :rules="[$validators.notEmpty]"
                            outlined
                            dense
                            hide-details
                            :menu-props="{ offsetY: true }"
                            :return-object="false"
                        />
                    </v-col>
                </v-row>
                <v-row dense class="mt-2">
                    <v-col cols="8">
                        <div class="subtitle-1">描述</div>
                        <v-text-field v-model="config.description" outlined dense hide-details />
                    </v-col>
                    <v-col>
                        <div class="subtitle-1">类型</div>
                        <v-select :value="'时间序列图'" :items="['时间序列图']" outlined dense hide-details disabled />
                    </v-col>
                </v-row>

                <div class="subtitle-1 mt-3">预览</div>
                <Panel :config="config" style="height: 240px" />

                <div v-for="(_, i) in config.source.metrics.queries" class="mb-6">
                    <div class="subtitle-1 mt-2">查询 #{{ i + 1 }}</div>

                    <div v-if="$api.context.multicluster" class="mb-3">
                        <div class="subtitle-1">数据源</div>
                        <div class="caption">选择要查询的集群/项目。</div>
                        <v-select
                            v-model="config.source.metrics.queries[i].datasource"
                            :items="datasources"
                            :rules="[$validators.notEmpty]"
                            outlined
                            dense
                            hide-details
                            placeholder="选择数据源"
                        />
                    </div>

                    <div class="subtitle-1 mt-2">PromQL 查询</div>
                    <div class="caption">PromQL 表达式。</div>
                    <MetricSelector v-model="config.source.metrics.queries[i].query" :datasource="config.source.metrics.queries[i].datasource" />

                    <div class="subtitle-1 mt-2">图例</div>
                    <div class="caption">
                        在图例和工具提示中显示的文本。使用 <var v-pre>{{ label_name }}</var> 插值标签值。
                    </div>
                    <v-text-field v-model="config.source.metrics.queries[i].legend" outlined dense hide-details />
                </div>
                <v-btn color="primary" @click="addQuery()">
                    <v-icon>mdi-plus</v-icon>
                    添加查询
                </v-btn>

                <div class="d-flex align-center gap-2 mt-4">
                    <div class="subtitle-1" style="min-width: 100px">堆叠序列</div>
                    <v-checkbox v-model="config.widget.chart.stacked" dense hide-details class="mt-0 pt-0" />
                </div>
                <div class="d-flex align-center gap-2 mt-2">
                    <div class="subtitle-1" style="min-width: 100px">显示</div>
                    <v-btn-toggle v-model="config.widget.chart.display" dense mandatory>
                        <v-btn value="line">折线</v-btn>
                        <v-btn value="bar">柱状</v-btn>
                    </v-btn-toggle>
                </div>
            </v-form>
            <div class="d-flex gap-1">
                <v-spacer />
                <v-btn color="primary" @click="apply" :disabled="!valid">应用</v-btn>
                <v-btn color="primary" outlined @click="dialog = false">取消</v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>
import MetricSelector from '@/components/MetricSelector.vue';
import Panel from '@/views/dashboards/Panel.vue';

export default {
    props: {
        value: Object,
        groups: Array,
    },

    components: { Panel, MetricSelector },

    data() {
        const panel = JSON.parse(JSON.stringify(this.value));
        let action = 'edit';
        if (!panel.config) {
            action = 'add';
            panel.config = {
                name: '',
                description: '',
                source: { metrics: { queries: [{ query: '', legend: '', color: '', datasource: '' }] } },
                widget: { chart: {} },
            };
        }
        return {
            loading: false,
            error: '',
            dialog: !!this.value,
            action,
            panel,
            valid: false,
            search: '',
        };
    },

    mounted() {
        if (this.panel.config.source.metrics.queries[0].datasource === '' && this.$api.context.multicluster && this.datasources.length > 0) {
            this.panel.config.source.metrics.queries[0].datasource = this.datasources[0];
        }
    },

    watch: {
        dialog(v) {
            !v && this.$emit('input', null);
        },
    },

    computed: {
        datasources() {
            return this.$api.context.member_projects;
        },
        groups_() {
            const groups = this.groups.map((g) => ({ value: g, text: g }));
            if (!this.search || this.groups.includes(this.search)) {
                return groups;
            }
            return [{ value: this.search, text: this.search + ' (添加新组)' }, ...this.groups];
        },
        config() {
            return this.panel.config;
        },
    },

    methods: {
        addQuery() {
            const newQuery = { query: '', legend: '', color: '', datasource: '' };
            if (this.$api.context.multicluster && this.datasources.length > 0) {
                newQuery.datasource = this.datasources[0];
            }
            this.config.source.metrics.queries.push(newQuery);
        },

        apply() {
            this.dialog = false;
            this.$emit(this.action, JSON.parse(JSON.stringify(this.panel)));
        },
    },
};
</script>

<style scoped></style>
