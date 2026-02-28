<template>
    <div>
        <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text class="mt-2">
            {{ error }}
        </v-alert>
        <v-alert v-if="disabled" color="info" outlined text>
            单点登录 (SSO) 仅在 Coroot 企业版中可用（起价为每月每 CPU 核心 1 美元）。
            <a href="https://coroot.com/account" target="_blank" class="font-weight-bold">立即开始</a> 您的免费试用。
        </v-alert>
        <v-alert v-if="readonly" color="primary" outlined text>
            单点登录通过配置文件配置，无法通过 UI 修改。
        </v-alert>
        <v-simple-table v-if="status !== 403" dense class="params">
            <tbody>
                <tr>
                    <td class="font-weight-medium text-no-wrap">状态</td>
                    <td>
                        <div v-if="enabled">
                            <v-icon color="success" class="mr-1" size="20">mdi-check-circle</v-icon>
                            已启用
                        </div>
                        <div v-else>已禁用</div>
                    </td>
                </tr>
                <tr>
                    <td class="font-weight-medium text-no-wrap">提供商</td>
                    <td>
                        <v-radio-group v-model="sso_provider" :disabled="disabled || readonly" row hide-details dense class="mt-0">
                            <v-radio label="SAML 2.0" value="saml"></v-radio>
                            <v-radio label="OIDC" value="oidc"></v-radio>
                        </v-radio-group>
                    </td>
                </tr>

                <template v-if="sso_provider === 'saml'">
                    <tr>
                        <td class="font-weight-medium text-no-wrap">身份提供商：</td>
                        <td>
                            <span v-if="provider" style="vertical-align: middle">{{ provider }}</span>
                            <input ref="file" type="file" accept=".xml" @change="upload" class="d-none" />
                            <v-btn v-if="!provider" color="primary" small :disabled="disabled || loading || readonly" @click="$refs.file.click()">
                                上传身份提供商元数据 XML
                            </v-btn>
                            <v-btn v-else :disabled="disabled || loading || readonly" small icon @click="$refs.file.click()">
                                <v-icon small>mdi-pencil</v-icon>
                            </v-btn>
                        </td>
                    </tr>
                    <tr>
                        <td class="font-weight-medium text-no-wrap">服务提供商发行者 / 实体 ID：</td>
                        <td>{{ saml_asc_url }} <CopyButton :text="saml_asc_url" :disabled="disabled" /></td>
                    </tr>
                    <tr>
                        <td class="font-weight-medium text-no-wrap">服务提供商 ACS URL / 单点登录 URL：</td>
                        <td>{{ saml_asc_url }} <CopyButton :text="saml_asc_url" :disabled="disabled" /></td>
                    </tr>
                    <tr>
                        <td class="font-weight-medium text-no-wrap">属性映射：</td>
                        <td>
                            Coroot 需要接收 <b>Email</b>、<b>FirstName</b> 和 <b>LastName</b> 属性。
                            <br />
                            请在您的身份提供商端配置属性映射。
                        </td>
                    </tr>
                </template>

                <template v-if="sso_provider === 'oidc'">
                    <tr>
                        <td class="font-weight-medium text-no-wrap">发行者 URL：</td>
                        <td>
                            <v-text-field
                                v-model="oidc.issuer_url"
                                :disabled="disabled || readonly"
                                outlined
                                dense
                                hide-details
                                placeholder="https://accounts.google.com"
                                class="oidc-input"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td class="font-weight-medium text-no-wrap">客户端 ID：</td>
                        <td>
                            <v-text-field v-model="oidc.client_id" :disabled="disabled || readonly" outlined dense hide-details class="oidc-input" />
                        </td>
                    </tr>
                    <tr>
                        <td class="font-weight-medium text-no-wrap">客户端密钥 (Client Secret)：</td>
                        <td>
                            <v-text-field
                                v-model="oidc.client_secret"
                                :disabled="disabled || readonly"
                                outlined
                                dense
                                hide-details
                                type="password"
                                :placeholder="oidc_has_secret ? '****************' : ''"
                                class="oidc-input"
                            />
                        </td>
                    </tr>
                    <tr>
                        <td class="font-weight-medium text-no-wrap">重定向 URI：</td>
                        <td>
                            {{ oidc_callback_url }} <CopyButton :text="oidc_callback_url" :disabled="disabled" />
                            <div class="caption grey--text mt-1">在您的 OIDC 提供商中将其配置为授权重定向 URL。</div>
                        </td>
                    </tr>
                    <tr>
                        <td class="font-weight-medium text-no-wrap">声明 (Claims)：</td>
                        <td>Coroot 需要从 ID 令牌中接收 <b>email</b>、<b>given_name</b> 和 <b>family_name</b> 声明。</td>
                    </tr>
                </template>

                <tr>
                    <td class="font-weight-medium text-no-wrap">默认角色：</td>
                    <td>
                        <v-select
                            v-model="default_role"
                            :items="roles"
                            :disabled="disabled || readonly"
                            outlined
                            dense
                            :menu-props="{ offsetY: true }"
                            :rules="[$validators.notEmpty]"
                            hide-details
                            class="roles"
                        />
                    </td>
                </tr>
            </tbody>
        </v-simple-table>
        <div v-if="status !== 403" class="d-flex mt-2" style="gap: 8px">
            <v-btn color="primary" small :disabled="disabled || loading || readonly || !canSave" @click="save">
                保存 <template v-if="!enabled">并启用</template>
            </v-btn>
            <v-btn v-if="enabled" color="error" small :disabled="disabled || loading || readonly" @click="disable">禁用</v-btn>
        </div>
    </div>
</template>

<script>
import CopyButton from '@/components/CopyButton.vue';

export default {
    components: { CopyButton },
    computed: {
        saml_asc_url() {
            return location.origin + this.$coroot.base_path + 'sso/saml';
        },
        oidc_callback_url() {
            return location.origin + this.$coroot.base_path + 'sso/oidc';
        },
        canSave() {
            if (this.sso_provider === 'saml') {
                return !!this.provider;
            } else if (this.sso_provider === 'oidc') {
                return !!(this.oidc.issuer_url && this.oidc.client_id && (this.oidc.client_secret || this.oidc_has_secret));
            }
            return false;
        },
    },

    data() {
        return {
            disabled: this.$coroot.edition !== 'Enterprise',
            readonly: false,
            loading: false,
            error: '',
            status: undefined,
            enabled: false,
            sso_provider: 'saml',
            default_role: '',
            provider: '',
            roles: [],
            oidc: {
                issuer_url: '',
                client_id: '',
                client_secret: '',
            },
            oidc_has_secret: false,
        };
    },

    mounted() {
        this.$events.watch(this, this.get, 'roles');
        this.get();
    },

    methods: {
        get() {
            this.loading = true;
            this.error = '';
            this.status = undefined;
            this.$api.sso(null, (data, error, status) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    this.status = status;
                    return;
                }
                this.readonly = data.readonly;
                this.enabled = data.enabled;
                this.sso_provider = data.sso_provider || 'saml';
                this.default_role = data.default_role;
                this.provider = data.provider;
                this.roles = data.roles || [];

                if (data.oidc) {
                    this.oidc = {
                        issuer_url: data.oidc.issuer_url || '',
                        client_id: data.oidc.client_id || '',
                        client_secret: '', // Never returned from backend
                    };
                    this.oidc_has_secret = !!(data.oidc.issuer_url && data.oidc.client_id);
                } else {
                    this.oidc_has_secret = false;
                }
            });
        },
        post(action, metadata) {
            this.loading = true;
            this.error = '';
            this.status = undefined;
            const form = {
                action,
                provider: this.sso_provider,
                default_role: this.default_role,
            };

            if (this.sso_provider === 'saml' && metadata) {
                form.saml = { metadata };
            } else if (this.sso_provider === 'oidc' && action === 'save') {
                form.oidc = {
                    issuer_url: this.oidc.issuer_url,
                    client_id: this.oidc.client_id,
                };
                if (this.oidc.client_secret) {
                    form.oidc.client_secret = this.oidc.client_secret;
                }
            }

            this.$api.sso(form, (data, error, status) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    this.status = status;
                    return;
                }
                this.get();
            });
        },
        save() {
            this.post('save');
        },
        disable() {
            this.post('disable');
        },
        upload(e) {
            const file = e.target.files[0];
            e.target.value = '';
            if (!file) {
                return;
            }
            file.text().then((v) => {
                this.post('upload', v);
            });
        },
    },
};
</script>

<style scoped>
.params:deep(td) {
    padding: 4px 16px !important;
}
.params:deep(td:first-child) {
    width: 280px;
}
.roles {
    max-width: 20ch;
}
.roles:deep(.v-input__slot) {
    min-height: initial !important;
    height: 2rem !important;
    padding: 0 8px !important;
}
.roles:deep(.v-input__append-inner) {
    margin-top: 4px !important;
}
.oidc-input {
    max-width: 500px;
}
.oidc-input:deep(.v-input__slot) {
    min-height: initial !important;
    height: 2rem !important;
    padding: 0 8px !important;
}
</style>
