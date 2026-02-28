<template>
    <v-alert color="red" elevation="2" border="left" colored-border class="mx-auto mt-5 pr-8" min-width="60%">
        <a href="https://docs.coroot.com/configuration/authentication" target="_blank" class="doc-link">
            <v-icon>mdi-information-outline</v-icon>
        </a>
        <div v-if="error === 'configuration'">
            <div>您的 SAML 集成似乎配置不当。</div>
            <div>
                Coroot 需要从您的身份提供商接收以下属性：<b>Email</b>、<b>FirstName</b> 和 <b>LastName</b>。
            </div>
        </div>
        <div v-else>使用 SAML 集成进行的身份验证不成功。</div>
        <div class="mt-2 d-flex" style="gap: 8px">
            <v-btn :to="{ name: 'index' }" color="primary">刷新</v-btn>
            <v-btn :to="{ name: 'login' }" color="warning">以管理员身份登录</v-btn>
        </div>
    </v-alert>
</template>

<script>
export default {
    computed: {
        error() {
            return this.$route.query.error;
        },
    },
};
</script>

<style scoped>
.doc-link {
    position: absolute;
    right: 8px;
    top: 8px;
}
</style>
