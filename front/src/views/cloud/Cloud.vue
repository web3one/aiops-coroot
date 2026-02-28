<template>
    <div style="max-width: 800px">
        <h1 class="text-h5 my-5">
            Coroot Cloud 集成
            <v-progress-circular v-if="loading" indeterminate color="success" size="24" width="2" class="ml-2" />
        </h1>

        <v-alert color="primary" outlined text>
            通过 AI 驱动的根因分析增强您的 Coroot 社区版。连接到 Coroot Cloud 即可获得自动为您调查故障的智能洞察。每月赠送 10 个免费额度——每个额度覆盖一次完整的根因分析，因此您可以免费调查多达 10 个故障。
        </v-alert>

        <p>
            <i>注意：请确保您的 Coroot 实例可以通过 HTTPS 443 端口连接到 <b>cloud.coroot.com</b></i>
        </p>

        <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text>
            {{ error }}
        </v-alert>

        <div v-if="form.api_key">
            <div class="text-h6 mt-5">连接状态</div>
            <div class="d-flex align-center mt-2 mb-3">
                <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
                <span class="font-weight-medium">已连接到 Coroot Cloud</span>
                <v-spacer />
                <v-btn icon color="error" @click="confirmDisconnect">
                    <v-icon>mdi-link-off</v-icon>
                </v-btn>
            </div>

            <div class="text-h6 mt-3">API Key</div>
            <div class="caption mb-2">
                您的 Coroot Cloud API Key。可在 IaC 的 Coroot 配置文件中使用，或直接在 Coroot 自定义资源中使用。
            </div>
            <div class="d-flex align-center" style="gap: 8px">
                <v-text-field :value="form.api_key" outlined dense readonly type="password" hide-details />
                <CopyButton :text="form.api_key" />
            </div>

            <div v-if="rca" class="text-h6 mt-5">账单与使用情况</div>
            <div v-if="rca" class="mt-2">
                <v-row>
                    <v-col cols="12" sm="6">
                        <div class="caption grey--text">当前方案</div>
                        <div class="font-weight-medium">{{ rca.plan }}</div>

                        <div class="caption grey--text mt-2">价格</div>
                        <div class="font-weight-medium">${{ rca.price }} / {{ rca.interval }}</div>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <div class="caption grey--text">额度使用情况</div>
                        <v-progress-linear
                            :value="(rca.credits_spent / rca.credits_total) * 100"
                            height="6"
                            rounded
                            color="primary"
                            class="mt-1 mb-1"
                        />
                        <div class="caption">已使用 {{ rca.credits_spent }} / {{ rca.credits_total }} 个额度</div>

                        <div class="caption grey--text mt-2">续期时间</div>
                        <div class="font-weight-medium">{{ $format.date(rca.renews_at * 1000, '{MMM} {DD}, {YYYY}') }}</div>
                    </v-col>
                </v-row>
            </div>

            <div class="text-h6 mt-4">设置</div>
            <div class="caption mb-2">
                启用后，Coroot 将在故障创建时自动进行调查。禁用此设置时，您也可以手动触发调查。
            </div>
            <v-checkbox v-model="form.incidents_auto_investigation" label="自动调查故障" dense hide-details />

            <v-btn color="primary" @click="saveSettings" :loading="loading" :disabled="!changed" class="mt-3"> 保存 </v-btn>

            <v-dialog v-model="disconnectDialog" max-width="500">
                <v-card class="pa-2">
                    <v-card-title>
                        <v-icon color="warning" class="mr-2">mdi-alert-outline</v-icon>
                        从 Coroot Cloud 断开连接？
                    </v-card-title>
                    <v-card-text>
                        <p class="mb-3">您确定要从 Coroot Cloud 断开连接吗？这将：</p>
                        <ul class="mb-3">
                            <li>禁用 AI 驱动的根因分析</li>
                            <li>停止自动故障调查</li>
                            <li>重新连接时需要再次身份验证</li>
                        </ul>
                        <p class="mb-0">您可以随时使用同一个账户重新连接。</p>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn text @click="disconnectDialog = false">取消</v-btn>
                        <v-btn color="error" @click="disconnect" :loading="loading"> 断开连接 </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
        <div v-else-if="!loading">
            <Signup v-if="auth === 'signup'" @signin="auth = 'signin'" @google="google" />
            <Signin v-if="auth === 'signin'" @signup="auth = 'signup'" @google="google" @success="getAPIKey" />
        </div>
    </div>
</template>

<script>
import cloud from './api';
import Signup from './Signup.vue';
import Signin from './Signin.vue';
import CopyButton from '@/components/CopyButton.vue';

export default {
    components: { Signup, Signin, CopyButton },

    data() {
        return {
            loading: false,
            error: '',
            message: '',

            auth: 'signup',

            form: {
                api_key: '',
                incidents_auto_investigation: true,
            },
            saved: '',

            rca: null,

            disconnectDialog: false,
        };
    },

    mounted() {
        if (this.$route.query.t) {
            this.getAPIKey(this.$route.query.t);
            this.$router.replace({ query: { ...this.$route.query, t: undefined } }).catch((err) => err);
            return;
        }
        this.get();
    },

    computed: {
        changed() {
            return this.saved !== JSON.stringify(this.form);
        },
    },

    methods: {
        get() {
            this.loading = true;
            this.error = '';
            this.$api.get('cloud', {}, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.form = data.form;
                this.saved = JSON.stringify(this.form);
                this.rca = data.info.rca;
            });
        },
        post() {
            this.loading = true;
            this.error = '';
            this.$api.post('cloud', this.form, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.get();
            });
        },
        saveSettings() {
            this.post(this.form);
        },
        confirmDisconnect() {
            this.disconnectDialog = true;
        },
        disconnect() {
            this.disconnectDialog = false;
            this.form.api_key = '';
            this.post();
        },
        getAPIKey(token) {
            cloud.token = token;
            this.loading = true;
            cloud.get('/account/api_keys', {}, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                const api_key = data && data.length && data[0].key;
                if (!api_key) {
                    this.error = 'Failed to get API key.';
                    return;
                }
                this.form.api_key = api_key;
                this.post();
            });
        },
        google() {
            const req = {
                State: JSON.stringify({ return_url: window.location.href }),
                RedirectURL: cloud.url + '/auth/google',
            };
            this.loading = true;
            cloud.post('/auth/google', req, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                window.location.href = data;
            });
        },
    },
};
</script>

<style scoped></style>
