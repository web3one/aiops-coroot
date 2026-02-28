<template>
    <div style="max-width: 800px">
        <h2 class="text-h5 mt-10 mb-5">API Key</h2>
        <p>下方的 API Key 授权 Coroot 的 Agent 和其他应用为此项目写入遥测数据。</p>
        <v-simple-table dense>
            <thead>
                <tr>
                    <th>描述</th>
                    <th>Key</th>
                    <th style="width: 100px">操作</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="k in keys">
                    <td>{{ k.description }}</td>
                    <td>
                        <template v-if="k.key"> {{ k.key }} <CopyButton :text="k.key" /> </template>
                        <template v-else>
                            <span class="grey--text">只有项目管理员可以访问 API Key。</span>
                        </template>
                    </td>
                    <td>
                        <v-btn icon small @click="open('edit', k)" :disabled="!editable"><v-icon small>mdi-pencil</v-icon></v-btn>
                        <v-btn icon small @click="open('delete', k)" :disabled="!editable"><v-icon small>mdi-trash-can-outline</v-icon></v-btn>
                    </td>
                </tr>
            </tbody>
        </v-simple-table>

        <v-btn color="primary" class="mt-4" small @click="open('generate', {})" :disabled="!editable">生成 API Key</v-btn>

        <v-dialog v-model="dialog" max-width="600">
            <v-card v-if="loading" class="pa-10">
                <v-progress-linear indeterminate />
            </v-card>
            <v-card else class="pa-4">
                <div class="d-flex align-center font-weight-bold mb-4">
                    <div v-if="form.action === 'generate'">生成 API Key</div>
                    <div v-else-if="form.action === 'delete'">删除 API Key</div>
                    <div v-else>编辑 API Key</div>
                    <v-spacer />
                    <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
                </div>
                <p v-if="form.action === 'delete'">
                    删除 API Key 可能会导致某些使用它的 Agent 或应用无法再向此项目写入遥测数据。
                </p>
                <div class="subtitle-1">描述</div>
                <v-text-field v-model="form.description" outlined dense :disabled="form.action === 'delete'"></v-text-field>
                <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text>
                    {{ error }}
                </v-alert>
                <div class="d-flex align-center">
                    <v-spacer />
                    <v-btn v-if="form.action === 'generate'" color="primary" :disabled="!form.description" :loading="loading" @click="post">
                        生成
                    </v-btn>
                    <v-btn v-else-if="form.action === 'delete'" color="error" :loading="loading" @click="post"> 删除 </v-btn>
                    <v-btn v-else color="primary" :disabled="!form.description" :loading="loading" @click="post"> 保存 </v-btn>
                </div>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import CopyButton from '@/components/CopyButton.vue';

export default {
    components: { CopyButton },

    data() {
        return {
            loading: false,
            error: '',
            editable: false,
            keys: [],
            dialog: false,
            form: {
                action: '',
                key: '',
                description: '',
            },
        };
    },

    mounted() {
        this.get();
    },

    methods: {
        open(action, key) {
            this.dialog = true;
            this.error = '';
            this.form.action = action;
            this.form.key = key.key || '';
            this.form.description = key.description || '';
        },
        get() {
            this.error = '';
            this.loading = true;
            this.$api.apiKeys(null, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.editable = data.editable;
                this.keys = data.keys || [];
            });
        },
        post() {
            this.error = '';
            this.loading = true;
            this.$api.apiKeys(this.form, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                setTimeout(() => {
                    this.dialog = false;
                }, 500);
                this.get();
            });
        },
    },
};
</script>

<style scoped></style>
