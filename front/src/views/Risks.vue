<template>
    <Views :loading="loading" :error="error">
        <ApplicationFilter :applications="applications" @filter="setFilter" class="mb-4" />

        <div class="legend mb-3">
            <div v-for="s in statuses" class="item">
                <div class="count" :class="s.color">{{ s.count }}</div>
                <div class="label">{{ s.name }}</div>
            </div>
            <v-checkbox
                label="显示已忽略"
                :value="showDismissed"
                @change="changeShowDismissed"
                class="font-weight-regular mt-0 pt-0 ml-2"
                style="margin-left: -4px"
                color="primary"
                hide-details
            />
        </div>

        <v-data-table
            dense
            class="table"
            mobile-breakpoint="0"
            :items-per-page="50"
            :items="items"
            must-sort
            no-data-text="未发现风险"
            ref="table"
            :headers="headers"
            :footer-props="{ itemsPerPageOptions: [10, 20, 50, 100, -1] }"
        >
            <template #item.application_id="{ item }">
                <div class="application">
                    <div class="name">
                        <router-link :to="{ name: 'overview', params: { id: item.application_id }, query: $utils.contextQuery() }">
                            {{ $utils.appId(item.application_id).name }}
                        </router-link>
                    </div>
                </div>
            </template>

            <template #item.cluster="{ item }">
                <div class="cluster">
                    {{ item.cluster }}
                </div>
            </template>

            <template #item.application_type="{ item }">
                <div v-if="item.application_type" class="d-flex align-center">
                    <img
                        v-if="item.application_type.icon"
                        :src="`${$coroot.base_path}static/img/tech-icons/${item.application_type.icon}.svg`"
                        onerror="this.style.display='none'"
                        height="16"
                        width="16"
                        class="icon"
                    />
                    <span class="type">{{ item.application_type.name }}</span>
                </div>
            </template>

            <template #item.severity="{ item }">
                <div class="risk">
                    <div class="status" :class="item.color" />
                    <span>{{ item.key.category }}</span>
                </div>
            </template>

            <template #item.description="{ item }">
                <div :class="{ 'grey--text': item.dismissal }">
                    <template v-if="item.exposure">
                        公开暴露的数据库：
                        <template v-if="item.exposure.ips.length > 1">
                            {{ item.exposure.ips.length }} 个 IP
                            <v-menu offset-y tile>
                                <template #activator="{ on }">
                                    <span v-on="on" class="text-no-wrap ips"> {{ item.exposure.ips[0] }}</span>
                                </template>
                                <v-list dense>
                                    <v-list-item v-for="v in item.exposure.ips" style="font-size: 14px; min-height: 32px">
                                        <v-list-item-title>{{ v }}</v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </template>
                        <span v-else>IP {{ item.exposure.ips[0] }}</span>
                        <template v-if="item.exposure.node_port_services">
                            ，通过 NodePort 服务
                            <v-menu offset-y tile>
                                <template #activator="{ on }">
                                    <span v-on="on" class="text-no-wrap ips"> {{ item.exposure.node_port_services[0] }}</span>
                                </template>
                                <v-list dense>
                                    <v-list-item v-for="s in item.exposure.node_port_services" style="font-size: 14px; min-height: 32px">
                                        <v-list-item-title>{{ s }}</v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </template>
                        <template v-else-if="item.exposure.load_balancer_services">
                            ，通过 LoadBalancer 服务
                            <v-menu offset-y tile>
                                <template #activator="{ on }">
                                    <span v-on="on" class="text-no-wrap ips"> {{ item.exposure.load_balancer_services[0] }}</span>
                                </template>
                                <v-list dense>
                                    <v-list-item v-for="s in item.exposure.load_balancer_services" style="font-size: 14px; min-height: 32px">
                                        <v-list-item-title>{{ s }}</v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </template>
                        <template v-else> ，端口 {{ item.exposure.ports.join(', ') }} </template>
                    </template>
                    <template v-else-if="item.availability">
                        {{ item.availability.description }}
                    </template>
                </div>
                <div v-if="item.dismissal" class="caption">
                    由 {{ item.dismissal.by }} 忽略 ({{ $format.date(item.dismissal.timestamp * 1000, '{YYYY}-{MM}-{DD} {HH}:{mm}:{ss}') }})，原因为 "{{ item.dismissal.reason }}"
                </div>
            </template>

            <template #item.actions="{ item }">
                <v-menu offset-y>
                    <template v-slot:activator="{ attrs, on }">
                        <v-btn icon x-small class="ml-1" v-bind="attrs" v-on="on">
                            <v-icon small>mdi-dots-vertical</v-icon>
                        </v-btn>
                    </template>

                    <v-list dense>
                        <template v-if="!item.dismissal">
                            <v-list-item @click="post('dismiss', item.key, item.application_id, '此项目可接受')">
                                <v-icon small class="mr-1">mdi-bell-off-outline</v-icon> 忽略：此项目可接受
                            </v-list-item>
                            <v-list-item
                                v-if="item.exposure"
                                @click="post('dismiss', item.key, item.application_id, '受网络策略控制')"
                            >
                                <v-icon small class="mr-1">mdi-security-network</v-icon> 忽略：受网络策略控制
                            </v-list-item>
                        </template>
                        <v-list-item v-else @click="post('mark_as_active', item.key, item.application_id)">
                            <v-icon small class="mr-1">mdi-bell-outline</v-icon> 标记为活动
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>
        </v-data-table>
    </Views>
</template>

<script>
import Views from '@/views/Views.vue';
import ApplicationFilter from '../components/ApplicationFilter.vue';

const statuses = {
    critical: { name: '严重', color: 'red lighten-1' },
    warning: { name: '警告', color: 'orange lighten-1' },
    ok: { name: '已忽略', color: 'grey lighten-1' },
};

export default {
    components: { Views, ApplicationFilter },

    data() {
        return {
            loading: false,
            error: '',
            risks: [],
            showDismissed: false,
            filter: new Set(),
        };
    },

    mounted() {
        this.get();
        this.$events.watch(this, this.get, 'refresh');
        this.showDismissed = this.$route.query.show_dismissed === '1';
    },

    watch: {
        items() {
            if (this.items.some((i) => i.severity === 'ok') && !this.showDismissed) {
                this.showDismissed = true;
            }
        },
    },

    computed: {
        headers() {
            let headers = [
                { value: 'application_id', text: '应用', sortable: true },
                { value: 'cluster', text: '集群', sortable: true },
                { value: 'application_type', text: '应用类型', sortable: false },
                { value: 'severity', text: '风险类别', sortable: false },
                { value: 'description', text: '描述', sortable: true },
                { value: 'actions', text: '', sortable: false, align: 'end', width: '20px' },
            ];
            if (!this.$api.context.multicluster) {
                return headers.filter((h) => h.value !== 'cluster');
            }
            return headers;
        },
        applications() {
            if (!this.risks) {
                return [];
            }
            const applications = {};

            this.risks.forEach((v) => {
                applications[v.application_id] = v.application_category;
            });
            return Object.keys(applications).map((id) => ({ id, category: applications[id] }));
        },
        items() {
            if (!this.risks) {
                return [];
            }
            let filtered = this.risks.filter((v) => this.filter.has(v.application_id));
            const shd = this.$route.query.show_dismissed;
            if (shd === '0') {
                filtered = filtered.filter((i) => i.severity !== 'ok');
            }
            if (shd === undefined) {
                const undismissed = filtered.filter((i) => i.severity !== 'ok');
                if (undismissed.length) {
                    filtered = undismissed;
                }
            }
            return filtered.map((i) => {
                return {
                    ...i,
                    color: statuses[i.severity].color,
                };
            });
        },
        statuses() {
            return Object.keys(statuses).map((s) => {
                return {
                    ...statuses[s],
                    count: this.risks.filter((i) => i.severity === s).length,
                };
            });
        },
    },

    methods: {
        get() {
            this.loading = true;
            const query = this.$route.query.query || '';
            this.$api.getOverview('risks', query, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.risks = data.risks || [];
            });
        },
        post(action, key, app_id, reason) {
            this.loading = true;
            this.error = '';
            this.$api.risks(app_id, { key, action, reason }, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.get();
            });
        },
        changeShowDismissed() {
            this.showDismissed = !this.showDismissed;
            this.$router.push({ query: { ...this.$route.query, show_dismissed: this.showDismissed ? '1' : '0' } }).catch((err) => err);
        },
        setFilter(filter) {
            this.filter = filter;
        },
    },
};
</script>

<style scoped>
.table:deep(table) {
    min-width: 500px;
}
.table:deep(tr:hover) {
    background-color: unset !important;
}
.table:deep(th),
.table:deep(td) {
    padding: 4px 8px !important;
}
.table:deep(th) {
    white-space: nowrap;
}
.table .application {
    display: flex;
    gap: 4px;
}
.table .application .name {
    max-width: 30ch;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.table .cluster {
    max-width: 20ch;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.risk {
    gap: 4px;
    display: flex;
}
.risk .status {
    height: 20px;
    width: 4px;
}
.ips {
    border-bottom: 1px dashed darkgray;
    cursor: pointer;
}
.icon {
    margin-right: 4px;
    opacity: 80%;
}
.type {
    opacity: 60%;
    white-space: nowrap;
}
.legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-weight: 500;
    font-size: 14px;
}
.legend .item {
    display: flex;
    gap: 4px;
}
.legend .count {
    padding: 0 4px;
    border-radius: 2px;
    height: 18px;
    line-height: 18px;
    color: rgba(255, 255, 255, 0.8);
}
.legend .label {
    opacity: 60%;
}
</style>
