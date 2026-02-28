<template>
    <div class="wrapper">
        <div class="text-center" style="max-width: 800px">
            <img :src="`${$coroot.base_path}static/icon.svg`" height="80" alt="Coroot Logo" />

            <h1 class="text-h4 mt-5 mb-3">欢迎使用 Coroot</h1>

            <div v-if="user.readonly">
                <p>看起来一切正常，但您目前没有权限访问任何项目。</p>
            </div>
            <div v-else>
                <p>看起来一切正常。现在让我们创建您的第一个项目吧！</p>
                <v-btn :to="{ name: 'project_new' }" color="primary" large class="mt-5"> 创建项目 </v-btn>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        user: Object,
    },
};
</script>

<style scoped>
.wrapper {
    height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
