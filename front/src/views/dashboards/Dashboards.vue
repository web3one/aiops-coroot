<template>
    <Views class="dashboards" :loading="loading" :error="error">
        <div class="d-flex">
            <v-text-field v-model="search" label="搜索" clearable dense hide-details prepend-inner-icon="mdi-magnify" outlined class="search" />
        </div>
        <v-data-table
            class="table"
            mobile-breakpoint="0"
            :items-per-page="20"
            :items="dashboards_"
            no-data-text="未发现仪表盘"
            :headers="[
                { value: 'name', text: '名称', sortable: true },
                { value: 'description', text: '描述', sortable: true },
                { value: 'actions', text: '操作', sortable: false, width: '90px', class: 'text-no-wrap' },
            ]"
            :footer-props="{ itemsPerPageOptions: [10, 20, 50, 100, -1] }"
        >
            <template #item.name="{ item: { id, name } }">
                <router-link :to="{ params: { id } }">{{ name }}</router-link>
            </template>
            <template #item.actions="{ item }">
                <v-btn small icon @click="edit('update', item)">
                    <v-icon small>mdi-pencil-outline</v-icon>
                </v-btn>
                <v-btn small icon @click="edit('delete', item)">
                    <v-icon small>mdi-trash-can-outline</v-icon>
                </v-btn>
            </template>
        </v-data-table>

        <v-btn color="primary" @click="edit('create', {})">
            <v-icon small>mdi-plus</v-icon>
            添加仪表盘
        </v-btn>

        <v-dialog v-model="dialog" max-width="600">
            <v-card class="pa-5">
                <div class="d-flex align-center font-weight-medium mb-4">
                    <template v-if="form.action === 'create'"> 创建仪表盘 </template>
                    <template v-else-if="form.action === 'delete'"> 删除仪表盘 </template>
                    <template v-else> 编辑仪表盘 </template>
                    <v-spacer />
                    <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
                </div>
                <v-form v-model="valid" :disabled="form.action === 'delete'">
                    <div class="subtitle-1">名称</div>
                    <v-text-field v-model="form.name" :rules="[$validators.notEmpty]" outlined dense />
                    <div class="subtitle-1">描述</div>
                    <v-text-field v-model="form.description" outlined dense />
                </v-form>
                <v-alert v-if="error" color="error" icon="mdi-alert-octagon-outline" outlined text class="my-3">
                    {{ error }}
                </v-alert>
                <v-alert v-if="message" color="success" outlined text class="my-3">
                    {{ message }}
                </v-alert>
                <div class="d-flex mt-3 gap-1">
                    <v-spacer />
                    <v-btn v-if="form.action === 'delete'" color="error" @click="post()" :loading="loading">删除</v-btn>
                    <v-btn v-else color="primary" @click="post()" :loading="loading" :disabled="!valid">保存</v-btn>
                    <v-btn color="primary" @click="dialog = false" outlined>取消</v-btn>
                </div>
            </v-card>
        </v-dialog>
    </Views>
</template>

<script>
import Views from '@/views/Views.vue';

export default {
    components: { Views },

    data() {
        return {
            loading: false,
            error: '',
            message: '',
            dashboards: [],

            dialog: false,
            form: {
                action: '',
                id: '',
                name: '',
                description: '',
            },
            valid: false,

            search: '',
        };
    },

    mounted() {
        this.get();
    },

    computed: {
        dashboards_() {
            if (!this.search) {
                return this.dashboards;
            }
            return this.dashboards.filter((d) => (d.name + ' ' + d.description).toLowerCase().includes(this.search.toLowerCase()));
        },
    },

    methods: {
        edit(action, d) {
            this.dialog = true;
            this.form.action = action;
            this.form.id = d.id || '';
            this.form.name = d.name || '';
            this.form.description = d.description || '';
        },
        get() {
            this.loading = true;
            this.error = '';
            this.$api.dashboards('', null, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.dashboards = data || [];
            });
        },
        post() {
            this.loading = true;
            this.error = '';
            this.message = '';
            this.$api.dashboards(this.form.id, this.form, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.dialog = false;
                this.action = '';
                if (this.form.action === 'create' && data) {
                    this.$router.push({ params: { id: data.trim() } }).catch(() => {});
                    return;
                }
                this.get();
            });
        },
    },
};
</script>

<style scoped>
.search {
    max-width: 200px !important;
}
</style>
