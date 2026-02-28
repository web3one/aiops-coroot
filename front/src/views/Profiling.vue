<template>
    <div>
        <v-card outlined class="my-4 pa-4">
            <div>
                <Led :status="view.status" />
                <template v-if="view.message">
                    <span v-html="view.message" />
                    <span v-if="view.status !== 'warning' && view.services && view.services.length">
                        (<a @click="configure = true">配置</a>)
                    </span>
                </template>
                <span v-else>加载中...</span>
            </div>
            <v-select
                v-if="view.profiles"
                :value="query.type"
                :items="profiles"
                @change="changeType"
                outlined
                hide-details
                dense
                :menu-props="{ offsetY: true }"
                class="mt-4"
            />
            <div v-if="view.chart" class="grey--text mt-3">
                <v-icon size="20" style="vertical-align: baseline">mdi-lightbulb-on-outline</v-icon>
                选择图表区域以放大或与上一周期进行对比
            </div>
            <v-progress-linear v-if="loading" indeterminate height="4" style="position: absolute; bottom: 0; left: 0" />
        </v-card>

        <Chart v-if="view.chart" :chart="view.chart" class="my-5" :selection="selection" @select="setSelection" :loading="loading" />

        <div style="position: relative; min-height: 100vh">
            <div v-if="!loading && loadingError" class="pa-3 text-center red--text">
                {{ loadingError }}
            </div>
            <FlameGraph
                v-if="view.profile"
                :profile="view.profile"
                :instances="view.instances || []"
                :instance="query.instance || ''"
                @change:instance="changeInstance"
                :limit="0.5"
                class="pt-2"
            />
        </div>

        <v-dialog v-model="configure" max-width="800">
            <v-card class="pa-5">
                <div class="d-flex align-center font-weight-medium mb-4">
                    将 "{{ $utils.appId(appId).name }}" 链接到应用
                    <v-spacer />
                    <v-btn icon @click="configure = false"><v-icon>mdi-close</v-icon></v-btn>
                </div>

                <div class="subtitle-1">选择对应的应用：</div>
                <v-select v-model="form.service" :items="services" outlined dense hide-details :menu-props="{ offsetY: true }" clearable />

                <div class="grey--text my-4">
                    要配置应用发送性能分析 (profiles)，请参考
                    <a href="https://docs.coroot.com/profiling" target="_blank">文档</a>。
                </div>

                <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text class="my-3">
                    {{ error }}
                </v-alert>
                <v-alert v-if="message" color="green" outlined text class="my-3">
                    {{ message }}
                </v-alert>
                <v-btn block color="primary" @click="save" :loading="saving" :disabled="!changed" class="mt-5">保存</v-btn>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import Chart from '../components/Chart.vue';
import Led from '../components/Led.vue';
import FlameGraph from '../components/FlameGraph.vue';

export default {
    props: {
        appId: String,
    },

    components: { Chart, Led, FlameGraph },

    data() {
        return {
            loading: false,
            loadingError: '',

            view: {},
            selection: { mode: 'diff' },

            configure: false,
            form: {
                service: null,
            },
            saved: '',
            saving: false,
            error: '',
            message: '',
        };
    },

    computed: {
        profiles() {
            return (this.view.profiles || []).map((p) => ({
                text: p.name || p.type,
                value: p.type,
            }));
        },
        query() {
            try {
                return JSON.parse(this.$route.query.query || '');
            } catch {
                return { type: '', from: 0, to: 0, mode: '' };
            }
        },
        services() {
            return (this.view.services || []).map((a) => a.name);
        },
        changed() {
            return !!this.form && this.saved !== JSON.stringify(this.form);
        },
    },

    mounted() {
        this.get();
        this.$events.watch(this, this.get, 'refresh');
        const { mode, from, to } = this.query;
        this.selection = { mode: mode || 'diff', from, to };
    },

    methods: {
        changeType(t) {
            this.setQuery({ type: t });
            this.get();
        },
        changeInstance(i) {
            this.setQuery({ instance: i || undefined });
            this.get();
        },
        setSelection(s) {
            const { mode, from, to } = s.selection;
            this.selection = { mode: mode || 'diff', from, to };
            this.setQuery({ mode, from, to }, s.ctx);
            this.get();
        },
        setQuery(q, ctx) {
            const query = JSON.stringify({ ...this.query, ...q });
            this.$router.replace({ query: { ...this.$route.query, ...ctx, query } }).catch((err) => err);
        },
        get() {
            this.loading = true;
            this.loadingError = '';
            this.$api.getProfiling(this.appId, this.$route.query.query, (data, error) => {
                this.loading = false;
                const errMsg = 'Failed to load profile';
                if (error) {
                    this.loadingError = error;
                    this.view.status = 'warning';
                    this.view.message = errMsg;
                    this.view.chart = null;
                    this.view.profile = null;
                    return;
                }
                this.view = data;
                const service = (this.view.services || []).find((s) => s.linked);
                this.form.service = service ? service.name : null;
                this.saved = JSON.stringify(this.form);
                if (this.view.profile && this.view.profile.type) {
                    this.setQuery({ type: this.view.profile.type });
                }
            });
        },
        save() {
            this.saving = true;
            this.error = '';
            this.message = '';
            this.$api.saveProfilingSettings(this.appId, this.form, (data, error) => {
                this.saving = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.message = '设置更新成功。';
                setTimeout(() => {
                    this.message = '';
                    this.configure = false;
                }, 1000);
                this.get();
            });
        },
    },
};
</script>

<style scoped></style>
