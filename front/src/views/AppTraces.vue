<template>
    <div>
        <v-card outlined class="mt-4 pa-4">
            <div>
                <Led :status="view.status" />
                <template v-if="view.message">
                    <span v-html="view.message" />
                    <span v-if="view.status !== 'warning'"> (<a @click="configure = true">配置</a>) </span>
                </template>
                <span v-else-if="loading">加载中...</span>
            </div>
            <template v-if="view.heatmap">
                <v-select
                    v-if="view.sources"
                    :value="source"
                    :items="sources"
                    @change="changeSource"
                    outlined
                    hide-details
                    dense
                    :menu-props="{ offsetY: true }"
                    class="mt-4"
                />
                <template v-if="!compact">
                    <div class="grey--text my-3">
                        <v-icon size="20" style="vertical-align: baseline">mdi-lightbulb-on-outline</v-icon>
                        选择图表区域以查看特定时间范围、持续时间或状态的链路。
                    </div>
                    <div class="d-flex flex-column flex-md-row" style="gap: 8px; row-gap: 8px">
                        <v-btn depressed small color="primary" :disabled="loading" class="text-body-2" @click="setSelection('errors')">
                            <v-icon left small class="mr-0">mdi-filter</v-icon>显示错误链路
                        </v-btn>
                        <v-btn depressed small color="primary" :disabled="loading" class="text-body-2" @click="setSelection('slo violations')">
                            <v-icon left small class="mr-0">mdi-filter</v-icon>显示延迟 SLO 违规
                        </v-btn>
                    </div>
                </template>
            </template>
            <v-progress-linear v-if="loading" indeterminate height="4" style="position: absolute; bottom: 0; left: 0" />
        </v-card>

        <Heatmap v-if="view.heatmap" :heatmap="view.heatmap" :selection="selection" @select="setSelection" :loading="loading" class="mt-5" />

        <div v-if="trace.id" class="mt-5" style="min-height: 50vh">
            <div class="d-flex">
                <div class="text-md-h6 mb-3">
                    <router-link :to="{ query: setTrace({ id: '', span: '' }) }">
                        <v-icon>mdi-arrow-left</v-icon>
                    </router-link>
                    链路 {{ trace.id }}
                </div>
                <v-spacer />
                <v-btn v-if="logsLink" :to="logsLink" small color="primary"> 显示日志 </v-btn>
            </div>
            <v-progress-linear v-if="loading" indeterminate color="green" height="4" />
            <TracingTrace v-if="view.spans" :spans="view.spans" :span="trace.span" />
        </div>

        <div v-else class="mt-5" style="min-height: 50vh">
            <v-simple-table dense class="spans">
                <thead>
                    <tr>
                        <th>链路 ID</th>
                        <th>客户端</th>
                        <th>状态</th>
                        <th>持续时间</th>
                        <th>名称</th>
                        <th>详情</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="s in view.spans">
                        <td>
                            <router-link :to="{ query: setTrace({ id: s.trace_id, span: s.id }) }" exact class="text-no-wrap">
                                <v-icon small style="vertical-align: baseline">mdi-chart-timeline</v-icon>
                                {{ s.trace_id.substring(0, 8) }}
                            </router-link>
                        </td>
                        <td class="text-no-wrap">{{ s.client }}</td>
                        <td class="text-no-wrap">
                            <v-icon v-if="s.status.error" color="error" small class="ml-1" style="margin-bottom: 2px">mdi-alert-circle</v-icon>
                            <v-icon v-else color="success" small class="ml-1" style="margin-bottom: 2px">mdi-check-circle</v-icon>
                            {{ s.status.message }}
                        </td>
                        <td class="text-no-wrap">
                            {{ s.duration.toFixed(1) }}
                            <span class="caption grey--text"> ms</span>
                        </td>
                        <td class="text-no-wrap">
                            {{ s.name }}
                        </td>
                        <td>
                            <div v-highlight="s.details.lang" class="details">{{ s.details.text }}</div>
                        </td>
                    </tr>
                </tbody>
            </v-simple-table>
            <div v-if="!loading && loadingError" class="pa-3 text-center red--text">
                {{ loadingError }}
            </div>
            <div v-else-if="!loading && (!view.spans || !view.spans.length)" class="pa-3 text-center grey--text">未发现链路</div>
            <div v-if="view.spans && view.spans.length && view.limit" class="text-right caption grey--text">
                输出限制为 {{ view.limit }} 条链路。
            </div>
        </div>

        <v-dialog v-model="configure" max-width="800">
            <v-card class="pa-5">
                <div class="d-flex align-center font-weight-medium mb-4">
                    将 "{{ $utils.appId(appId).name }}" 链接到服务
                    <v-spacer />
                    <v-btn icon @click="configure = false"><v-icon>mdi-close</v-icon></v-btn>
                </div>

                <div class="subtitle-1">选择对应的 OpenTelemetry 服务：</div>
                <v-select v-model="form.service" :items="services" outlined dense hide-details :menu-props="{ offsetY: true }" clearable />

                <div class="grey--text my-4">
                    要配置应用发送链路，请参考
                    <a href="https://docs.coroot.com/tracing" target="_blank">文档</a>。
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
import Led from '../components/Led.vue';
import Heatmap from '../components/Heatmap.vue';
import TracingTrace from '../components/TracingTrace.vue';

export default {
    props: {
        appId: String,
        compact: Boolean,
    },

    components: { Heatmap, Led, TracingTrace },

    data() {
        return {
            loading: false,
            loadingError: '',

            view: {},
            init: false,

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
        sources() {
            return (this.view.sources || []).map((s) => ({
                text: s.name,
                value: { type: s.type },
            }));
        },
        source() {
            return { type: this.trace.type };
        },
        services() {
            return (this.view.services || []).map((a) => a.name);
        },
        changed() {
            return !!this.form && this.saved !== JSON.stringify(this.form);
        },
        trace() {
            const parts = (this.$route.query.trace || '').split(':');
            return {
                type: parts[0] || '',
                id: parts[1] || '',
                tsRange: parts[2] || '-',
                durRange: parts[3] || '-',
                span: parts[4] || '',
            };
        },
        selection() {
            const t = this.trace;
            if (t.span && this.view.heatmap) {
                const span = this.view.spans.find((s) => s.id === t.span);
                if (span) {
                    const hm = this.view.heatmap;
                    const x1 = span.timestamp - hm.ctx.step;
                    const x2 = span.timestamp + hm.ctx.step;
                    let i = -1;
                    if (span.status.error) {
                        i = hm.series.findIndex((s) => s.value === 'err');
                    } else {
                        i = hm.series.findIndex((s) => Number(s.value) > span.duration / 1000);
                        if (i === -1) {
                            i = hm.series.findIndex((s) => s.value === 'inf');
                        }
                    }
                    if (i === -1) {
                        return null;
                    }
                    const y1 = i === 0 ? '' : hm.series[i - 1].value;
                    const y2 = hm.series[i].value;
                    return { x1, x2, y1, y2 };
                }
            }
            let parts = t.tsRange.split('-');
            const x1 = Number(parts[0]) || 0;
            const x2 = Number(parts[1]) || 0;
            parts = t.durRange.split('-');
            const y1 = parts[0] || '';
            const y2 = parts[1] || '';
            return { x1, x2, y1, y2 };
        },
        logsLink() {
            if (this.source.type !== 'otel') {
                return null;
            }
            const query = JSON.stringify({ source: 'otel', filters: [{ name: 'TraceId', op: '=', value: this.trace.id }] });
            return { params: { report: 'Logs' }, query: { query, ...this.$utils.contextQuery() } };
        },
    },

    mounted() {
        this.get();
        this.$events.watch(this, this.get, 'refresh');
    },

    watch: {
        '$route.query.trace'() {
            this.get();
        },
    },

    methods: {
        setTrace(t, ctx) {
            t = { ...this.trace, ...t };
            const trace = `${t.type}:${t.id}:${t.tsRange}:${t.durRange}:${t.span}`;
            return { ...this.$route.query, ...ctx, trace };
        },
        changeSource(v) {
            const query = this.setTrace({ type: v.type, id: '', span: '' });
            this.$router.push({ query }).catch((err) => err);
        },
        setSelection(s) {
            const hm = this.view.heatmap;
            if (!hm || !hm.series) {
                return;
            }
            const ts = hm.series.find((s) => !!s.threshold);
            const threshold = !ts ? 0 : ts.value;
            switch (s) {
                case 'errors':
                    s = { y1: 'inf', y2: 'err' };
                    break;
                case 'slo violations':
                    s = { y1: threshold, y2: 'inf' };
                    break;
            }
            const { from, to } = hm.ctx;
            const tsRange = `${s.x1 || ''}-${s.x2 || ''}`;
            const durRange = `${s.y1 || ''}-${s.y2 || ''}`;
            const query = this.setTrace({ id: '', tsRange, durRange, span: '' }, { from, to });
            this.$router.push({ query }).catch((err) => err);
        },
        get() {
            if (this.init) {
                this.init = false;
                return;
            }
            this.loading = true;
            this.loadingError = '';
            this.view.spans = [];
            this.$api.getTracing(this.appId, this.$route.query.trace, (data, error) => {
                this.loading = false;
                const errMsg = '加载链路失败';
                if (error) {
                    this.loadingError = error;
                    this.view.status = 'warning';
                    this.view.message = errMsg;
                    this.view.spans = [];
                    return;
                }
                this.view = data;
                if (this.view.status === 'warning') {
                    this.loadingError = this.view.message;
                    this.view.message = errMsg;
                    return;
                }
                const service = (this.view.services || []).find((s) => s.linked);
                this.form.service = service ? service.name : null;
                this.saved = JSON.stringify(this.form);
                const source = (this.view.sources || []).find((s) => s.selected);
                if (source) {
                    const query = this.setTrace({ type: source.type });
                    if (this.$route.query.trace !== query.trace) {
                        this.init = true;
                        this.$router.replace({ query }).catch((err) => err);
                    }
                }
            });
        },
        save() {
            this.saving = true;
            this.error = '';
            this.message = '';
            this.$api.saveTracingSettings(this.appId, this.form, (data, error) => {
                this.saving = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.message = '设置更新成功。';
                this.changeSource({ type: '' });
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

<style scoped>
.details {
    font-family: monospace, monospace;
    font-size: 14px;
    white-space: nowrap;
    cursor: pointer;
}
</style>
