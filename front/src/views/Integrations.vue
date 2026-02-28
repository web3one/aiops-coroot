<template>
    <div style="max-width: 800px">
        <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text>
            {{ error }}
        </v-alert>
        <v-alert v-if="message" color="green" outlined text>
            {{ message }}
        </v-alert>
        <v-alert v-if="readonly" color="primary" outlined text>
            通知设置通过配置文件定义，无法通过 UI 修改。
        </v-alert>
        <v-form :disabled="readonly">
            <div class="subtitle-1">基础 URL</div>
            <div class="caption">此 URL 用于在告警中创建链接等操作。</div>
            <div class="d-flex">
                <v-text-field v-model="form.base_url" :rules="[$validators.isUrl]" outlined dense />
                <v-btn @click="save" color="primary" :loading="saving" :disabled="readonly" class="ml-2" height="38">保存</v-btn>
            </div>
        </v-form>

        <v-simple-table>
            <thead>
                <tr>
                    <th>类型</th>
                    <th>通知故障</th>
                    <th>通知部署</th>
                    <th>通知告警</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="i in integrations">
                    <td>
                        {{ i.title }}
                        <div class="caption">{{ i.details }}</div>
                    </td>
                    <td>
                        <v-icon v-if="i.configured" small :color="i.incidents ? 'green' : ''">
                            {{ i.incidents ? 'mdi-check' : 'mdi-minus' }}
                        </v-icon>
                    </td>
                    <td>
                        <v-icon v-if="i.configured" small :color="i.deployments ? 'green' : ''">
                            {{ i.deployments ? 'mdi-check' : 'mdi-minus' }}
                        </v-icon>
                    </td>
                    <td>
                        <v-icon v-if="i.configured" small :color="i.alerts ? 'green' : ''">
                            {{ i.alerts ? 'mdi-check' : 'mdi-minus' }}
                        </v-icon>
                    </td>
                    <td>
                        <v-btn v-if="!i.configured" :disabled="readonly" small @click="open(i, 'new')" color="primary">配置</v-btn>
                        <div v-else class="d-flex">
                            <v-btn icon small @click="open(i, readonly ? 'view' : 'edit')">
                                <v-icon small>{{ readonly ? 'mdi-eye' : 'mdi-pencil' }}</v-icon>
                            </v-btn>
                            <v-btn icon small :disabled="readonly" @click="open(i, 'del')">
                                <v-icon small>mdi-trash-can-outline</v-icon>
                            </v-btn>
                        </div>
                    </td>
                </tr>
            </tbody>
        </v-simple-table>

        <IntegrationForm v-if="action" v-model="action" :type="integration.type" :title="integration.title" />
    </div>
</template>

<script>
import IntegrationForm from './IntegrationForm.vue';

export default {
    props: {
        projectId: String,
    },

    components: { IntegrationForm },

    data() {
        return {
            loading: false,
            error: '',
            message: '',
            readonly: false,
            saving: false,
            form: {
                base_url: '',
            },
            integrations: [],
            integration: {},
            action: '',
        };
    },

    mounted() {
        this.get();
        this.$events.watch(this, this.get, 'refresh');
    },

    watch: {
        projectId() {
            this.get();
        },
    },

    methods: {
        open(i, action) {
            this.integration = i;
            this.action = action;
        },
        get() {
            this.loading = true;
            this.error = '';
            this.$api.getIntegrations('', (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.form.base_url = data.base_url;
                if (!this.form.base_url) {
                    this.form.base_url = location.origin + this.$coroot.base_path;
                    this.$api.saveIntegrations('', 'save', this.form, () => {});
                }
                this.integrations = data.integrations;
                this.readonly = data.readonly;
            });
        },
        save() {
            this.saving = true;
            this.error = '';
            this.message = '';
            this.$api.saveIntegrations('', 'save', this.form, (data, error) => {
                this.saving = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.message = '设置更新成功。';
                setTimeout(() => {
                    this.message = '';
                }, 1000);
                this.get();
            });
        },
    },
};
</script>

<style scoped></style>
