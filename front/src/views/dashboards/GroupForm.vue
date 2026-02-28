<template>
    <v-dialog v-model="dialog" max-width="600">
        <v-card class="pa-5">
            <div class="d-flex align-center font-weight-medium mb-4">
                <template v-if="form.action === 'delete'"> 删除面板组 </template>
                <template v-else> 编辑面板组 </template>
                <v-spacer />
                <v-btn icon @click="dialog = false"><v-icon>mdi-close</v-icon></v-btn>
            </div>
            <v-form v-model="valid" :disabled="form.action === 'delete'">
                <div class="subtitle-1">名称</div>
                <v-text-field v-model="form.name" :rules="[$validators.notEmpty]" outlined dense />
            </v-form>
            <div class="d-flex mt-3 gap-1">
                <v-spacer />
                <v-btn v-if="form.action === 'delete'" color="error" @click="apply()">删除</v-btn>
                <v-btn v-else color="primary" @click="apply()" :disabled="!valid">应用</v-btn>
                <v-btn color="primary" @click="dialog = false" outlined>取消</v-btn>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    props: {
        value: Object,
    },

    data() {
        return {
            dialog: !!this.value,
            form: JSON.parse(JSON.stringify(this.value)),
            valid: false,
        };
    },

    watch: {
        dialog(v) {
            !v && this.$emit('input', null);
        },
    },

    methods: {
        apply() {
            this.$emit(this.form.action, this.form.id, this.form.name);
            this.dialog = false;
        },
    },
};
</script>
<style scoped></style>
