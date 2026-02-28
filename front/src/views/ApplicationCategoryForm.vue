<template>
    <v-dialog v-model="dialog" max-width="800">
        <v-card class="pa-4">
            <div class="d-flex align-center font-weight-medium mb-4">
                <div v-if="value === 'add'">添加新应用分类</div>
                <div v-else-if="value === 'delete'">删除 "{{ this.name }}" 应用分类</div>
                <div v-else>编辑 "{{ this.name }}" 应用分类</div>
                <v-spacer />
                <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
            </div>

            <v-form v-if="form" ref="form" v-model="valid" :disabled="value === 'delete'" class="form">
                <div class="subtitle-1">名称</div>
                <v-text-field v-model="form.name" outlined dense :disabled="form.builtin" :rules="[$validators.isSlug]" />

                <template v-if="!form.default">
                    <template v-if="form.builtin">
                        <div class="subtitle-1">内置模式</div>
                        <v-textarea v-model="form.builtin_patterns" outlined dense rows="1" auto-grow disabled />
                    </template>

                    <div class="subtitle-1">自定义模式</div>
                    <div class="caption">
                        以空格分隔的 <a href="https://en.wikipedia.org/wiki/Glob_(programming)" target="_blank">通配符模式 (glob patterns)</a>，
                        格式为 <var>&lt;namespace&gt;/&lt;application_name&gt;</var>，例如：<var>staging/* test-*/*</var>
                    </div>
                    <v-textarea v-model="form.custom_patterns" outlined dense rows="1" auto-grow />
                </template>

                <div class="subtitle-1">通知设置</div>
                <div class="d-flex mt-2 mb-2">
                    <v-checkbox v-model="form.notification_settings.incidents.enabled" hide-details class="mt-0 pt-0" />
                    <div>获取故障通知 (SLO 违规)</div>
                </div>
                <div v-if="form.notification_settings.incidents.enabled" class="mt-1">
                    <div class="ml-3">
                        <div v-if="form.notification_settings.incidents.slack" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.incidents.slack.enabled" dense hide-details class="mt-0 pt-0" />
                            <div class="mr-2">Slack</div>
                            <v-text-field
                                v-model="form.notification_settings.incidents.slack.channel"
                                hide-details
                                outlined
                                dense
                                prefix="频道："
                                class="x-dense"
                            />
                            <v-btn
                                small
                                color="secondary"
                                class="ml-2"
                                @click="test({ incident: { slack: { channel: form.notification_settings.incidents.slack.channel } } })"
                            >
                                测试
                            </v-btn>
                        </div>
                        <div v-if="form.notification_settings.incidents.teams" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.incidents.teams.enabled" dense hide-details class="mt-0 pt-0" />
                            <div>MS Teams</div>
                            <v-btn small color="secondary" class="ml-2" @click="test({ incident: { teams: {} } })">测试</v-btn>
                        </div>
                        <div v-if="form.notification_settings.incidents.pagerduty" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.incidents.pagerduty.enabled" dense hide-details class="mt-0 pt-0" />
                            <div>Pagerduty</div>
                            <v-btn small color="secondary" class="ml-2" @click="test({ incident: { pagerduty: {} } })">测试</v-btn>
                        </div>
                        <div v-if="form.notification_settings.incidents.opsgenie" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.incidents.opsgenie.enabled" dense hide-details class="mt-0 pt-0" />
                            <div>Opsgenie</div>
                            <v-btn small color="secondary" class="ml-2" @click="test({ incident: { opsgenie: {} } })">测试</v-btn>
                        </div>
                        <div v-if="form.notification_settings.incidents.webhook" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.incidents.webhook.enabled" dense hide-details class="mt-0 pt-0" />
                            <div>Webhook</div>
                            <v-btn small color="secondary" class="ml-2" @click="test({ incident: { webhook: {} } })">测试</v-btn>
                        </div>
                        <div v-if="!hasConfiguredIntegration(form.notification_settings.incidents)" class="ml-5 grey--text">
                            未配置通知集成。
                        </div>
                    </div>
                </div>

                <div class="d-flex mt-3 mb-2">
                    <v-checkbox v-model="form.notification_settings.deployments.enabled" hide-details class="mt-0 pt-0" />
                    <div>获取部署通知</div>
                </div>
                <div v-if="form.notification_settings.deployments.enabled" class="mt-1">
                    <div class="ml-3">
                        <div v-if="form.notification_settings.deployments.slack" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.deployments.slack.enabled" dense hide-details class="mt-0 pt-0" />
                            <div class="mr-2">Slack</div>
                            <v-text-field
                                v-model="form.notification_settings.deployments.slack.channel"
                                hide-details
                                outlined
                                dense
                                prefix="频道："
                                class="x-dense"
                            />
                            <v-btn
                                small
                                color="secondary"
                                class="ml-2"
                                @click="test({ deployment: { slack: { channel: form.notification_settings.deployments.slack.channel } } })"
                            >
                                测试
                            </v-btn>
                        </div>
                        <div v-if="form.notification_settings.deployments.teams" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.deployments.teams.enabled" dense hide-details class="mt-0 pt-0" />
                            <div class="mr-2">MS Teams</div>
                            <v-btn small color="secondary" class="ml-2" @click="test({ deployment: { teams: {} } })">测试</v-btn>
                        </div>
                        <div v-if="form.notification_settings.deployments.webhook" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.deployments.webhook.enabled" dense hide-details class="mt-0 pt-0" />
                            <div>Webhook</div>
                            <v-btn small color="secondary" class="ml-2" @click="test({ deployment: { webhook: {} } })">测试</v-btn>
                        </div>
                        <div v-if="!hasConfiguredIntegration(form.notification_settings.deployments)" class="ml-5 grey--text">
                            未配置通知集成。
                        </div>
                    </div>
                </div>

                <div class="d-flex mt-3 mb-2">
                    <v-checkbox v-model="form.notification_settings.alerts.enabled" hide-details class="mt-0 pt-0" />
                    <div>获取告警通知</div>
                </div>
                <div v-if="form.notification_settings.alerts.enabled" class="mt-1">
                    <div class="ml-3">
                        <div v-if="form.notification_settings.alerts.slack" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.alerts.slack.enabled" dense hide-details class="mt-0 pt-0" />
                            <div class="mr-2">Slack</div>
                            <v-text-field
                                v-model="form.notification_settings.alerts.slack.channel"
                                hide-details
                                outlined
                                dense
                                prefix="频道："
                                class="x-dense"
                            />
                            <v-btn
                                small
                                color="secondary"
                                class="ml-2"
                                @click="test({ alert: { slack: { channel: form.notification_settings.alerts.slack.channel } } })"
                            >
                                测试
                            </v-btn>
                        </div>
                        <div v-if="form.notification_settings.alerts.teams" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.alerts.teams.enabled" dense hide-details class="mt-0 pt-0" />
                            <div class="mr-2">MS Teams</div>
                            <v-btn small color="secondary" class="ml-2" @click="test({ alert: { teams: {} } })">测试</v-btn>
                        </div>
                        <div v-if="form.notification_settings.alerts.pagerduty" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.alerts.pagerduty.enabled" dense hide-details class="mt-0 pt-0" />
                            <div>Pagerduty</div>
                            <v-btn small color="secondary" class="ml-2" @click="test({ alert: { pagerduty: {} } })">测试</v-btn>
                        </div>
                        <div v-if="form.notification_settings.alerts.opsgenie" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.alerts.opsgenie.enabled" dense hide-details class="mt-0 pt-0" />
                            <div>Opsgenie</div>
                            <v-btn small color="secondary" class="ml-2" @click="test({ alert: { opsgenie: {} } })">测试</v-btn>
                        </div>
                        <div v-if="form.notification_settings.alerts.webhook" class="d-flex align-center mt-2">
                            <v-checkbox v-model="form.notification_settings.alerts.webhook.enabled" dense hide-details class="mt-0 pt-0" />
                            <div>Webhook</div>
                            <v-btn small color="secondary" class="ml-2" @click="test({ alert: { webhook: {} } })">测试</v-btn>
                        </div>
                        <div v-if="!hasConfiguredIntegration(form.notification_settings.alerts)" class="ml-5 grey--text">
                            未配置通知集成。
                        </div>
                    </div>
                </div>
                <v-btn
                    color="primary"
                    small
                    :to="{ name: 'project_settings', params: { tab: 'notifications' } }"
                    @click="form.active = false"
                    class="mt-4"
                >
                    配置集成
                </v-btn>

                <v-alert v-if="error" color="error" icon="mdi-alert-octagon-outline" outlined text class="my-2">
                    {{ error }}
                </v-alert>
                <v-alert v-if="message" color="success" outlined text class="my-2">
                    {{ message }}
                </v-alert>
                <div class="d-flex align-center">
                    <v-spacer />
                    <v-btn v-if="value === 'delete'" color="error" :loading="loading" @click="post">删除</v-btn>
                    <v-btn v-else color="primary" :disabled="!valid" :loading="loading" @click="post">保存</v-btn>
                </div>
            </v-form>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    props: {
        value: String,
        name: String,
        extra_custom_patterns: String,
    },

    data() {
        return {
            dialog: !!this.value,
            loading: false,
            error: '',
            message: '',
            valid: false,
            form: null,
        };
    },

    watch: {
        dialog(v) {
            this.$emit('input', v ? this.value : '');
        },
    },

    mounted() {
        this.get(this.name);
    },

    methods: {
        get(name) {
            this.loading = true;
            this.error = '';
            this.$api.applicationCategories(name, null, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                if (this.value === 'add') {
                    this.$refs.form && this.$refs.form.resetValidation();
                }
                this.form = data;
                if (this.extra_custom_patterns) {
                    this.form.custom_patterns += ' ' + this.extra_custom_patterns;
                }
            });
        },
        post() {
            this.loading = true;
            this.error = '';
            this.message = '';
            const form = { ...this.form, action: this.value };
            this.$api.applicationCategories(this.name, form, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.$events.emit('refresh');
                if (this.value === 'delete') {
                    this.dialog = false;
                } else {
                    this.message = '设置更新成功。';
                    setTimeout(() => {
                        this.message = '';
                    }, 3000);
                }
            });
        },
        test(test) {
            this.loading = true;
            this.error = '';
            this.message = '';
            const form = { action: 'test', test };
            this.$api.applicationCategories(this.name, form, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.message = '测试通知发送成功。';
                setTimeout(() => {
                    this.message = '';
                }, 3000);
            });
        },
        hasConfiguredIntegration(s) {
            return s.slack || s.teams || s.pagerduty || s.opsgenie || s.webhook;
        },
    },
};
</script>

<style scoped>
.x-dense {
    max-width: 30% !important;
}
.x-dense:deep(.v-input__slot) {
    min-height: 28px !important;
}
.x-dense:deep(.v-text-field__prefix) {
    color: var(--text-color-dimmed);
}
.x-dense:deep(input) {
    padding: 0 !important;
}
</style>
