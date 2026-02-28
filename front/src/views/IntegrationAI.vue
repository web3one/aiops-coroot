<template>
    <div style="max-width: 800px">
        <p>
            Coroot 利用大语言模型 (LLM) 自动生成清晰、简洁的根因摘要，帮助您的团队更快地排查故障。
        </p>
        <v-alert v-if="disabled" color="info" outlined text>
            仅在 Coroot 企业版中可用（起价为每月每 CPU 核心 1 美元）。<br />
            <a href="https://coroot.com/account" target="_blank" class="font-weight-bold">立即开始</a> 您的免费试用。
        </v-alert>
        <v-alert v-if="readonly" color="primary" outlined text>
            AI 设置通过配置文件定义，无法通过 UI 修改。
        </v-alert>
        <v-form v-if="form" v-model="valid" :disabled="disabled || readonly" ref="form">
            <div class="subtitle-1 mt-3">模型提供商</div>
            <v-radio-group v-model="form.provider" row dense class="mt-0" hide-details>
                <v-radio value="anthropic">
                    <template #label>
                        <img :src="`${$coroot.base_path}static/img/icons/anthropic.svg`" height="20" width="20" class="mr-1" />
                        Anthropic
                    </template>
                </v-radio>
                <v-radio value="openai">
                    <template #label>
                        <img :src="`${$coroot.base_path}static/img/icons/openai.svg`" height="20" width="20" class="mr-1" />
                        OpenAI
                    </template>
                </v-radio>
                <v-radio value="openai_compatible">
                    <template #label>
                        <v-icon class="mr-1">mdi-cog-outline</v-icon>
                        兼容 OpenAI 的 API
                    </template>
                </v-radio>
                <v-radio value="">
                    <template #label>
                        <v-icon class="mr-1">mdi-trash-can-outline</v-icon>
                        已禁用
                    </template>
                </v-radio>
            </v-radio-group>

            <template v-if="form.provider === 'anthropic'">
                <div class="subtitle-1 mt-3">API Key</div>
                <div class="caption">
                    要将 Coroot 与 Anthropic 模型集成，请提供您的 Anthropic API key。您可以参考
                    <a href="https://docs.anthropic.com/en/api/getting-started" target="_blank">Anthropic 官方 API 文档</a>。
                </div>
                <v-text-field
                    v-model="form.anthropic.api_key"
                    :rules="[$validators.notEmpty]"
                    outlined
                    dense
                    hide-details
                    single-line
                    type="password"
                />
            </template>

            <template v-if="form.provider === 'openai'">
                <div class="subtitle-1 mt-3">API Key</div>
                <div class="caption">
                    要将 Coroot 与 OpenAI 模型集成，请提供您的 OpenAI API key。了解更多关于 API 的信息请访问
                    <a href="https://openai.com/index/openai-api/" target="_blank">OpenAI API 概览页面</a>。
                </div>
                <v-text-field v-model="form.openai.api_key" :rules="[$validators.notEmpty]" outlined dense hide-details single-line type="password" />
            </template>

            <template v-if="form.provider === 'openai_compatible'">
                <div class="subtitle-1 mt-3">基础 URL</div>
                <div class="caption">
                    模型提供商的 API 请求基础 URL。有关配置详情，请参阅其文档。
                </div>
                <v-text-field v-model="form.openai_compatible.base_url" :rules="[$validators.isUrl]" outlined dense hide-details single-line />

                <div class="subtitle-1 mt-3">API Key</div>
                <div class="caption">要将 Coroot 与兼容 OpenAI 的模型集成，请提供您的 API key。</div>
                <v-text-field
                    v-model="form.openai_compatible.api_key"
                    :rules="[$validators.notEmpty]"
                    outlined
                    dense
                    hide-details
                    single-line
                    type="password"
                />

                <div class="subtitle-1 mt-3">模型</div>
                <div class="caption">要使用的模型名称或 ID。有效值请参阅提供商的文档。</div>
                <v-text-field v-model="form.openai_compatible.model" :rules="[$validators.notEmpty]" outlined dense hide-details single-line />
            </template>

            <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text class="mt-3">
                {{ error }}
            </v-alert>
            <v-alert v-if="message" color="green" outlined text class="mt-3">
                {{ message }}
            </v-alert>
            <div class="mt-3 d-flex" style="gap: 8px">
                <v-btn color="primary" @click="save" :disabled="disabled || readonly || !valid || !changed" :loading="loading">保存</v-btn>
            </div>
        </v-form>
    </div>
</template>

<script>
export default {
    components: {},

    data() {
        return {
            disabled: this.$coroot.edition !== 'Enterprise',
            readonly: false,
            form: { provider: '', anthropic: {}, openai: {}, openai_compatible: {} },
            valid: false,
            loading: false,
            error: '',
            message: '',
            saved: {},
        };
    },

    mounted() {
        this.get();
    },
    computed: {
        changed() {
            return JSON.stringify(this.form) !== JSON.stringify(this.saved);
        },
    },

    methods: {
        get() {
            this.loading = true;
            this.error = '';
            this.$api.ai(null, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.readonly = data.readonly;
                this.form.provider = data.provider;
                this.form.anthropic = data.anthropic || {};
                this.form.openai = data.openai || {};
                this.form.openai_compatible = data.openai_compatible || {};
                this.saved = JSON.parse(JSON.stringify(this.form));
            });
        },
        save() {
            this.loading = true;
            this.error = '';
            this.message = '';
            const form = JSON.parse(JSON.stringify(this.form));
            this.$api.ai(form, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.message = '设置更新成功。';
                setTimeout(() => {
                    this.message = '';
                }, 3000);
                this.get();
            });
        },
    },
};
</script>

<style scoped></style>
