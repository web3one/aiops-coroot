<template>
    <div class="mx-auto">
        <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text>
            {{ error }}
        </v-alert>

        <h1 class="text-h5 mb-5">项目配置</h1>

        <v-tabs :value="tab" height="40" show-arrows slider-size="2">
            <v-tab v-for="t in tabs" :key="t.id" :to="{ params: { tab: t.id } }" :disabled="t.disabled" :tab-value="t.id" exact>
                {{ t.name }}
            </v-tab>
        </v-tabs>

        <template v-if="!tab">
            <h2 class="text-h5 my-5">常规项目设置</h2>

            <v-form v-if="form" v-model="valid" ref="form" style="max-width: 800px">
                <v-alert v-if="readonly" color="primary" outlined text>
                    此项目通过配置文件定义，无法通过 UI 修改。
                </v-alert>
                <v-alert v-if="multicluster" color="primary" outlined text>
                    此项目汇总了下方成员项目的遥测数据。
                </v-alert>

                <v-form v-model="valid" :disabled="readonly" @submit.prevent="save">
                    <div class="subtitle-1">项目名称</div>
                    <div class="caption">
                        项目是一个独立的集群或环境，例如 <var>production</var>、<var>staging</var> 或 <var>prod-us-west</var>。
                    </div>
                    <v-text-field v-model="form.name" :rules="[$validators.isSlug]" outlined dense required />

                    <div class="subtitle-1">成员项目</div>
                    <div class="caption">如果定义了成员项目，此项目将作为已配置项目的多集群展示。</div>

                    <v-autocomplete
                        :items="availableProjects"
                        v-model="form.member_projects"
                        color="primary"
                        multiple
                        outlined
                        dense
                        chips
                        small-chips
                        deletable-chips
                        hide-details
                        class="mb-6"
                        :disabled="readonly"
                    >
                        <template #selection="{ item }">
                            <v-chip
                                small
                                label
                                :close="!readonly"
                                close-icon="mdi-close"
                                @click:close="removeMemberProject(item)"
                                color="primary"
                                class="member"
                            >
                                <span :title="item">{{ item }}</span>
                            </v-chip>
                        </template>
                    </v-autocomplete>

                    <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text>
                        {{ error }}
                    </v-alert>
                    <v-alert v-if="message" color="green" outlined text>
                        {{ message }}
                    </v-alert>
                    <v-btn block color="primary" @click="save" :disabled="readonly || !valid" :loading="loading">保存</v-btn>
                </v-form>
            </v-form>

            <template v-if="projectId">
                <template v-if="!multicluster">
                    <ProjectStatus :projectId="projectId" />
                    <ProjectApiKeys v-if="!multicluster" />
                </template>

                <h2 class="text-h5 mt-10 mb-5">危险区域</h2>
                <ProjectDelete :projectId="projectId" />
            </template>
        </template>

        <template v-if="tab === 'prometheus'">
            <h1 class="text-h5 my-5">
                Prometheus 集成
                <a href="https://docs.coroot.com/configuration/prometheus" target="_blank">
                    <v-icon>mdi-information-outline</v-icon>
                </a>
            </h1>
            <IntegrationPrometheus />
        </template>

        <template v-if="tab === 'clickhouse'">
            <h1 class="text-h5 my-5">
                ClickHouse 集成
                <a href="https://docs.coroot.com/configuration/clickhouse" target="_blank">
                    <v-icon>mdi-information-outline</v-icon>
                </a>
            </h1>
            <p>
                Coroot 将
                <a href="https://docs.coroot.com/logs" target="_blank">日志</a>、<a href="https://docs.coroot.com/tracing" target="_blank">链路追踪</a>
                和 <a href="https://docs.coroot.com/profiling" target="_blank">性能分析 (Profiling)</a> 存储在 ClickHouse 数据库中。
            </p>
            <IntegrationClickhouse />
        </template>

        <template v-if="tab === 'ai'">
            <h1 class="text-h5 my-5">AI 驱动的根因分析</h1>
            <IntegrationAI />
        </template>

        <template v-if="tab === 'aws'">
            <h1 class="text-h5 my-5">AWS 集成</h1>
            <IntegrationAWS />
        </template>

        <template v-if="tab === 'applications'">
            <h2 class="text-h5 my-5" id="categories">
                应用分类
                <a href="https://docs.coroot.com/configuration/application-categories" target="_blank">
                    <v-icon>mdi-information-outline</v-icon>
                </a>
            </h2>
            <p>
                您可以通过在 <var>&lt;namespace&gt;/&lt;application_name&gt;</var> 格式下定义
                <a href="https://en.wikipedia.org/wiki/Glob_(programming)" target="_blank">通配符模式</a>
                来将您的应用分组。对于 Kubernetes 应用，也可以通过注解 Kubernetes 对象来定义分类。有关更多详细信息，请参阅
                <a href="https://docs.coroot.com/configuration/application-categories" target="_blank">文档</a>。
            </p>
            <ApplicationCategories />

            <h2 class="text-h5 mt-10 mb-5" id="custom-applications">
                自定义应用
                <a href="https://docs.coroot.com/configuration/custom-applications" target="_blank">
                    <v-icon>mdi-information-outline</v-icon>
                </a>
            </h2>

            <p>Coroot 使用以下方法将单个容器分组为应用：</p>

            <ul class="mb-3">
                <li><b>Kubernetes 元数据</b>：Pod 按 Deployment、StatefulSet 等进行分组。</li>
                <li>
                    <b>非 Kubernetes 容器</b>：诸如 Docker 容器或 Systemd 单元之类的容器按其名称分组为应用。例如，不同主机上名为 <var>mysql</var> 的 Systemd 服务会被分组成一个名为
                    <var>mysql</var> 的应用。
                </li>
            </ul>

            <p>
                这种默认方法在大多数情况下都运行良好。但是，由于没有人比您更了解您的系统，Coroot 允许您手动调整应用分组以更好地满足您的特定需求。您可以通过为 <var>instance_name</var> 定义
                <a href="https://en.wikipedia.org/wiki/Glob_(programming)" target="_blank">通配符模式</a>
                来匹配所需的应用实例。请注意，这不适用于 Kubernetes 应用，Kubernetes 应用可以通过注解 Kubernetes 对象进行自定义。有关更多详细信息，请参阅
                <a href="https://docs.coroot.com/configuration/custom-applications" target="_blank">文档</a>。
            </p>

            <CustomApplications />
        </template>

        <template v-if="tab === 'notifications'">
            <h1 class="text-h5 my-5">
                通知集成
                <a href="https://docs.coroot.com/alerting/slo-monitoring" target="_blank">
                    <v-icon>mdi-information-outline</v-icon>
                </a>
            </h1>
            <Integrations />
        </template>

        <template v-if="tab === 'organization'">
            <h1 class="text-h5 my-5">
                用户
                <a href="https://docs.coroot.com/configuration/authentication" target="_blank">
                    <v-icon>mdi-information-outline</v-icon>
                </a>
            </h1>
            <Users />
            <h1 class="text-h5 mt-10 mb-5">
                基于角色的访问控制 (RBAC)
                <a href="https://docs.coroot.com/configuration/rbac" target="_blank">
                    <v-icon>mdi-information-outline</v-icon>
                </a>
            </h1>
            <RBAC />
            <h1 class="text-h5 mt-10 mb-5">
                单点登录 (SSO)
                <a href="https://docs.coroot.com/configuration/authentication/#single-sign-on-sso" target="_blank">
                    <v-icon>mdi-information-outline</v-icon>
                </a>
            </h1>
            <SSO />
        </template>

        <template v-if="tab === 'cloud'">
            <Cloud />
        </template>
    </div>
</template>

<script>
import ProjectApiKeys from './ProjectApiKeys.vue';
import ProjectDelete from './ProjectDelete.vue';
import ApplicationCategories from './ApplicationCategories.vue';
import Integrations from './Integrations.vue';
import IntegrationPrometheus from './IntegrationPrometheus.vue';
import IntegrationClickhouse from './IntegrationClickhouse.vue';
import IntegrationAWS from './IntegrationAWS.vue';
import CustomApplications from './CustomApplications.vue';
import Users from './Users.vue';
import RBAC from './RBAC.vue';
import SSO from './SSO.vue';
import IntegrationAI from '@/views/IntegrationAI.vue';
import Cloud from './cloud/Cloud.vue';
import ProjectStatus from '@/views/ProjectStatus.vue';

export default {
    props: {
        projectId: String,
        tab: String,
    },

    components: {
        ProjectStatus,
        IntegrationAI,
        CustomApplications,
        IntegrationPrometheus,
        IntegrationClickhouse,
        IntegrationAWS,
        ProjectApiKeys,
        ProjectDelete,
        ApplicationCategories,
        Integrations,
        Users,
        RBAC,
        SSO,
        Cloud,
    },

    data() {
        return {
            status: null,
            error: null,
            loading: false,
            form: {
                name: '',
                member_projects: [],
            },
            readonly: false,
            valid: false,
            message: '',
            availableProjects: [],
        };
    },

    watch: {
        projectId() {
            this.get();
        },
    },

    mounted() {
        this.get();
        if (!this.tabs.find((t) => t.id === this.tab)) {
            this.$router.replace({ params: { tab: undefined } });
        }
    },

    computed: {
        multicluster() {
            return this.form.member_projects !== undefined && this.form.member_projects.length > 0;
        },
        tabs() {
            const disabled = !this.projectId;
            let tabs = [
                { id: undefined, name: '常规' },
                { id: 'prometheus', name: 'Prometheus', disabled: disabled || this.multicluster },
                { id: 'clickhouse', name: 'Clickhouse', disabled: disabled || this.multicluster },
                { id: 'ai', name: 'AI' },
                { id: 'cloud', name: 'Coroot Cloud' },
                { id: 'aws', name: 'AWS', disabled },
                { id: 'applications', name: '应用设置', disabled },
                { id: 'notifications', name: '通知', disabled },
                { id: 'organization', name: '组织' },
            ];
            tabs = tabs.filter((t) => t.id !== 'cloud');
            return tabs;
        },
    },

    methods: {
        get() {
            this.loading = true;
            this.error = '';
            this.$api.getProject(this.projectId, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.readonly = data.readonly;
                this.form.name = data.name;
                this.availableProjects = data.available_projects || [];
                this.form.member_projects = data.member_projects;
                if (!this.projectId && this.$refs.form) {
                    this.$refs.form.resetValidation();
                }
            });
        },
        save() {
            if (!this.valid) {
                return;
            }
            this.loading = true;
            this.error = '';
            this.message = '';
            this.$api.saveProject(this.projectId, this.form, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.$events.emit('projects');
                this.message = 'Settings were successfully updated.';
                setTimeout(() => {
                    this.message = '';
                }, 1000);
                if (!this.projectId) {
                    const projectId = data.trim();
                    this.$router.replace({ name: 'project_settings', params: { projectId, tab: 'prometheus' } }).catch((err) => err);
                }
            });
        },
        removeMemberProject(p) {
            const i = this.form.member_projects.indexOf(p);
            if (i >= 0) {
                this.form.member_projects.splice(i, 1);
            }
        },
    },
};
</script>

<style scoped>
*:deep(.v-list-item) {
    font-size: 14px !important;
    padding: 0 8px !important;
}
*:deep(.v-list-item__action) {
    margin: 4px !important;
}
.member {
    margin: 4px 4px 0 0 !important;
    padding: 0 8px !important;
}
.member span {
    max-width: 20ch;
    overflow: hidden;
    text-overflow: ellipsis;
}
.member:deep(.v-icon) {
    font-size: 16px !important;
}
</style>
