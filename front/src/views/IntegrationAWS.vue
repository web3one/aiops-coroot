<template>
    <div style="max-width: 800px">
        <p>
            此集成使 Coroot 能够发现 RDS 和 ElastiCache 实例并收集其遥测数据。它需要描述 RDS 和 ElastiCache 实例、读取其日志以及从 CloudWatch 读取增强监控数据的权限。
        </p>

        <p>
            <b>步骤 #1</b>：创建
            <a
                href="https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_create-console.html#access_policies_create-json-editor"
                target="_blank"
            >
                IAM 策略
            </a>
            并包含 <a @click="policyDialog = true">以下权限</a>。
        </p>
        <v-dialog v-model="policyDialog" max-width="800">
            <v-card class="pa-5">
                <div class="text-h6 d-flex mb-5">
                    MonitoringReadOnlyAccess 角色
                    <v-spacer />
                    <v-btn icon @click="policyDialog = false"><v-icon>mdi-close</v-icon></v-btn>
                </div>
                <Code>
                    <pre>
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "rds:DescribeDBInstances",
                "rds:DescribeDBLogFiles",
                "rds:DownloadDBLogFilePortion",
                "rds:ListTagsForResource",
                "elasticache:DescribeCacheClusters",
                "elasticache:ListTagsForResource"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:GetLogEvents"
            ],
            "Resource": [
                "arn:aws:logs:*:*:log-group:RDSOSMetrics:log-stream:*"
            ]
        }
    ]
}
                    </pre>
                </Code>
            </v-card>
        </v-dialog>

        <p>
            <b>步骤 #2</b>：创建一个具有编程访问权限的
            <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html#id_users_create_console" target="_blank">IAM 用户</a>，
            将上述策略附加给它，并在下面的表单中使用 AccessKeyID/SecretAccessKey。
        </p>

        <v-form v-if="form" v-model="valid" ref="form">
            <div class="subtitle-1 mt-3">区域</div>
            <div class="caption">Coroot 仅发现在指定区域内的 RDS 和 ElastiCache 实例，例如：<var>us-west-1</var></div>
            <v-text-field v-model="form.region" :rules="[$validators.notEmpty]" outlined dense hide-details single-line clearable />

            <div class="subtitle-1 mt-3">Access Key ID</div>
            <v-text-field v-model="form.access_key_id" :rules="[$validators.notEmpty]" outlined dense hide-details single-line />

            <div class="subtitle-1 mt-3">Secret Access Key</div>
            <v-text-field v-model="form.secret_access_key" :rules="[$validators.notEmpty]" outlined dense hide-details single-line type="password" />

            <div class="subtitle-1 mt-3">RDS 标签过滤器</div>
            <div class="caption">
                您可以通过基于标签过滤 RDS 实例来限制发现范围。
                <br />
                指定 tag_name=tag_value 键值对，值的部分支持 <a href="https://en.wikipedia.org/wiki/Glob_(programming)" target="_blank">通配符模式 (glob patterns)</a>，例如：<var>team=qa,env=staging*</var>。
            </div>
            <v-text-field v-model="rds_tag_filters" outlined dense hide-details single-line />
            <div class="subtitle-1 mt-3">ElastiCache 标签过滤器</div>
            <div class="caption">
                您可以通过基于标签过滤 ElastiCache 实例来限制发现范围。
                <br />
                指定 tag_name=tag_value 键值对，值的部分支持 <a href="https://en.wikipedia.org/wiki/Glob_(programming)" target="_blank">通配符模式 (glob patterns)</a>，例如：<var>team=qa,env=staging*</var>。
            </div>
            <v-text-field v-model="elasticache_tag_filters" outlined dense hide-details single-line />

            <v-alert v-if="error" color="red" icon="mdi-alert-octagon-outline" outlined text class="mt-3">
                {{ error }}
            </v-alert>
            <v-alert v-if="message" color="green" outlined text class="mt-3">
                {{ message }}
            </v-alert>
            <div class="mt-3">
                <v-btn v-if="saved.region && !form.region" block color="error" @click="del" :loading="loading">删除</v-btn>
                <v-btn v-else block color="primary" @click="save" :disabled="!valid" :loading="loading">保存</v-btn>
            </div>
        </v-form>

        <h2 class="text-h6 mt-10 mb-3">发现状态</h2>
        <v-alert v-if="form && !form.region" color="primary" outlined text> 未配置 </v-alert>
        <v-alert v-else-if="errors.length" color="error" outlined text class="pb-2">
            <div v-for="e in errors" class="mb-2">• {{ e }}</div>
        </v-alert>
        <v-alert v-else-if="!error" color="success" outlined text> 正常 </v-alert>
        <v-alert v-else outlined text> 未知 </v-alert>

        <h2 class="text-h6 mt-10 mb-3">已发现的实例</h2>
        <v-data-table
            :items="instances"
            sort-by="application_id"
            must-sort
            dense
            class="instances"
            mobile-breakpoint="0"
            :items-per-page="20"
            no-data-text="未发现实例"
            :headers="[
                { value: 'application_id', text: '应用', align: 'start' },
                { value: 'name', text: '实例', align: 'start' },
                { value: 'status', text: '状态', align: 'start' },
                { value: 'engine', text: '引擎', align: 'start' },
                { value: 'engine_version', text: '版本', align: 'start' },
                { value: 'instance_type', text: '实例类型', align: 'start' },
                { value: 'availability_zone', text: '可用区', align: 'start' },
            ]"
            :footer-props="{ itemsPerPageOptions: [10, 20, 50, 100, -1] }"
        >
            <template #item.application_id="{ item }">
                <router-link :to="{ name: 'overview', params: { view: 'applications', id: item.application_id } }" class="text-no-wrap">
                    {{ $utils.appId(item.application_id).name }}
                </router-link>
            </template>
        </v-data-table>
    </div>
</template>

<script>
import Code from '../components/Code.vue';

function map2str(m) {
    return Object.entries(m || {})
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
}

function str2map(s) {
    const res = {};
    s.split(',').forEach((f) => {
        const [k, v] = f.split('=');
        if (k && v && k.trim() && v.trim()) {
            res[k.trim()] = v.trim();
        }
    });
    return res;
}

export default {
    components: { Code },

    data() {
        return {
            form: null,
            valid: false,
            loading: false,
            error: '',
            message: '',
            rds_tag_filters: '',
            elasticache_tag_filters: '',
            saved: null,
            policyDialog: false,
            errors: [],
            instances: [],
        };
    },

    mounted() {
        this.get();
    },

    methods: {
        get() {
            this.loading = true;
            this.error = '';
            this.$api.getIntegrations('aws', (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.form = data.form;
                this.rds_tag_filters = map2str(this.form.rds_tag_filters);
                this.elasticache_tag_filters = map2str(this.form.elasticache_tag_filters);
                this.saved = JSON.parse(JSON.stringify(this.form));
                this.errors = data.view.errors || [];
                this.instances = data.view.instances || [];
            });
        },
        save() {
            this.loading = true;
            this.error = '';
            this.message = '';
            this.form.rds_tag_filters = str2map(this.rds_tag_filters);
            this.form.elasticache_tag_filters = str2map(this.elasticache_tag_filters);
            const form = JSON.parse(JSON.stringify(this.form));
            this.$api.saveIntegrations('aws', 'save', form, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.message = '设置更新成功。更改将在一两分钟内生效。';
                setTimeout(() => {
                    this.message = '';
                }, 3000);
                this.get();
            });
        },
        del() {
            this.loading = true;
            this.error = '';
            this.message = '';
            this.$api.saveIntegrations('aws', 'del', null, (data, error) => {
                this.loading = false;
                if (error) {
                    this.error = error;
                    return;
                }
                this.get();
            });
        },
    },
};
</script>

<style scoped></style>
