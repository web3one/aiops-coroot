<template>
    <div class="form">
        <div class="text-center">
            <img :src="`${$coroot.base_path}static/icon.svg`" alt=":~#" height="80" />
        </div>

        <h2 class="text-h4 my-5 text-center">欢迎使用 Coroot</h2>

        <v-btn v-if="sso_enabled && !set_admin_password" block large color="primary" class="mb-4" :href="ssoLoginUrl">
            <v-icon left>mdi-shield-key-outline</v-icon>
            使用 SSO 登录
        </v-btn>

        <div v-if="sso_enabled && !set_admin_password" class="text-center my-4">
            <v-divider class="d-inline-block" style="width: 40%; vertical-align: middle" />
            <span class="grey--text mx-3">或</span>
            <v-divider class="d-inline-block" style="width: 40%; vertical-align: middle" />
        </div>

        <v-form v-model="valid" @submit.prevent="post" ref="form">
            <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text>
                {{ error }}
            </v-alert>
            <v-alert v-else-if="message" color="green" outlined text>
                {{ message }}
            </v-alert>

            <div class="font-weight-medium">邮箱</div>
            <v-text-field
                outlined
                dense
                type="email"
                v-model="form.email"
                name="email"
                :rules="[$validators.notEmpty]"
                :disabled="set_admin_password"
            />

            <div class="font-weight-medium">密码</div>
            <v-text-field outlined dense type="password" v-model="form.password" name="password" :rules="[$validators.notEmpty]" />

            <template v-if="set_admin_password">
                <div class="font-weight-medium">确认密码</div>
                <v-text-field
                    outlined
                    dense
                    type="password"
                    v-model="confirm_password"
                    :rules="[$validators.notEmpty, (v) => v === form.password || '密码不匹配']"
                />
            </template>

            <v-btn block type="submit" :disabled="!valid" :loading="loading" color="primary" class="mt-5">
                <template v-if="set_admin_password"> 设置管理员密码并登录 </template>
                <template v-else> 登录 </template>
            </v-btn>
        </v-form>

        <div v-if="!set_admin_password" class="caption grey--text text-center mt-10">
            如果您忘记了邮箱或密码，请联系 Coroot 管理员。
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            form: {
                email: '',
                password: '',
            },
            confirm_password: '',
            valid: false,
            error: '',
            message: '',
            loading: false,
            sso_enabled: false,
        };
    },

    computed: {
        set_admin_password() {
            return this.$route.query.action === 'set_admin_password';
        },
        ssoLoginUrl() {
            const next = this.$route.query.next || '/';
            return this.$router.resolve({ path: this.$coroot.base_path + 'api/sso-login', query: { next } }).href;
        },
    },

    mounted() {
        this.checkSSOStatus();
        if (this.$route.query.sso_error) {
            this.error = 'SSO 身份验证失败。请重试或使用密码登录。';
        }
    },

    watch: {
        set_admin_password: {
            handler(v) {
                if (v) {
                    this.form.email = 'admin';
                }
            },
            immediate: true,
        },
    },

    methods: {
        checkSSOStatus() {
            if (this.$coroot.edition !== 'Enterprise') {
                this.sso_enabled = false;
                return;
            }
            this.$api.ssoStatus((data, error) => {
                if (error) {
                    this.sso_enabled = false;
                    return;
                }
                this.sso_enabled = data.enabled;
            });
        },
        post() {
            this.loading = true;
            this.error = '';
            const form = { ...this.form };
            if (this.set_admin_password) {
                form.action = 'set_admin_password';
            }
            this.$api.login(form, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.$router.push(this.$route.query.next || { name: 'index' });
            });
        },
    },
};
</script>

<style scoped>
.form {
    max-width: 600px;
    margin: 100px auto;
}
</style>
