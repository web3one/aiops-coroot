<template>
    <div>
        <v-simple-table>
            <thead>
                <tr>
                    <th>应用名称</th>
                    <th>实例模式</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="app in applications">
                    <td class="text-no-wrap">
                        <div class="text-no-wrap">{{ app.name }}</div>
                    </td>
                    <td style="line-height: 2em">
                        <template v-for="p in app.instance_patterns.split(' ').filter((p) => !!p)">
                            <span class="pattern">{{ p }}</span>
                            &nbsp;
                        </template>
                    </td>
                    <td>
                        <div class="d-flex">
                            <v-btn icon small @click="openForm(app)"><v-icon small>mdi-pencil</v-icon></v-btn>
                            <v-btn icon small @click="openForm(app, true)"><v-icon small>mdi-trash-can-outline</v-icon></v-btn>
                        </div>
                    </td>
                </tr>
            </tbody>
        </v-simple-table>

        <v-btn color="primary" class="mt-3" @click="openForm()" small>添加应用</v-btn>

        <v-dialog v-model="form.active" max-width="800">
            <v-card class="pa-4">
                <div class="d-flex align-center font-weight-medium mb-4">
                    <div v-if="form.new">添加新自定义应用</div>
                    <div v-else-if="form.del">删除 "{{ form.name }}" 应用</div>
                    <div v-else>编辑 "{{ form.name }}" 应用</div>
                    <v-spacer />
                    <v-btn icon @click="form.active = false"><v-icon>mdi-close</v-icon></v-btn>
                </div>

                <v-form v-model="form.valid" ref="form">
                    <div class="subtitle-1">名称</div>
                    <v-text-field v-model="form.name" outlined dense :disabled="form.del" :rules="[$validators.isSlug]" />

                    <template>
                        <div class="subtitle-1">实例模式</div>
                        <div class="caption">
                            以空格分隔的 <a href="https://en.wikipedia.org/wiki/Glob_(programming)" target="_blank">通配符模式 (glob patterns)</a>，
                            匹配 <var>instance_name</var>，例如：<var>mysql@node1 cassandra@cass-node*</var>
                        </div>
                        <v-textarea v-model="form.instance_patterns" outlined dense rows="1" auto-grow :disabled="form.del" />
                    </template>

                    <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text>
                        {{ error }}
                    </v-alert>
                    <v-alert v-if="message" color="green" outlined text>
                        {{ message }}
                    </v-alert>
                    <div class="d-flex align-center">
                        <v-spacer />
                        <v-btn v-if="form.del" color="error" :loading="saving" @click="save">删除</v-btn>
                        <v-btn v-else color="primary" :disabled="!form.valid" :loading="saving" @click="save">保存</v-btn>
                    </div>
                </v-form>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
export default {
    props: {
        projectId: String,
    },

    data() {
        return {
            applications: [],
            loading: false,
            error: '',
            message: '',
            form: {
                active: false,
                new: false,
                del: false,
                oldName: '',
                name: '',
                instance_patterns: '',
                valid: true,
            },
            saving: false,
        };
    },

    mounted() {
        this.get();
    },

    watch: {
        projectId() {
            this.get();
        },
    },

    methods: {
        get() {
            this.loading = true;
            this.error = '';
            this.$api.getCustomApplications((data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.applications = data.custom_applications;

                const app = this.applications ? this.applications.find((a) => a.name === this.$route.query.custom_app) || {} : {};
                const p = this.$route.query.instance_pattern;
                if (!app.name && !p) {
                    return;
                }
                if (p) {
                    if (!app.instance_patterns) {
                        app.instance_patterns = p;
                    } else {
                        app.instance_patterns += ' ' + p;
                    }
                }
                this.openForm(app);
                this.$router.replace({ query: { ...this.$route.query, custom_app: undefined, instance_pattern: undefined }, hash: this.$route.hash });
            });
        },
        openForm(application, del) {
            this.error = '';
            this.form.active = true;
            this.form.new = !application || !application.name;
            this.form.del = del;
            this.form.oldName = application ? application.name : '';
            this.form.name = application ? application.name : '';
            this.form.instance_patterns = application ? application.instance_patterns : '';
            this.$refs.form && this.$refs.form.resetValidation();
        },
        save() {
            this.saving = true;
            this.error = '';
            this.message = '';
            const patterns = this.form.del ? '' : this.form.instance_patterns;
            const form = {
                name: this.form.oldName,
                new_name: this.form.name,
                instance_patterns: patterns,
            };
            this.$api.saveCustomApplication(form, (data, error) => {
                this.saving = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.message = '设置更新成功。';
                setTimeout(() => {
                    this.message = '';
                    this.form.active = false;
                }, 1000);
                this.get();
            });
        },
    },
};
</script>

<style scoped>
.pattern {
    border: 1px solid #bdbdbd;
    border-radius: 4px;
    padding: 2px 4px;
    white-space: nowrap;
}
</style>
