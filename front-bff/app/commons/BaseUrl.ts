export class BaseUrl {

    public static OVERVIEW = {
        pageMain: "/group",
        pageOpenService: "/group/service"
    }

    public static BUCKET = {
        pageMain: "/bucket",
        pageDetail: "/bucket/detail/",
        pageList: "/bucket/list/",
        pageCreate: "/bucket/create",
        pageDelete: "/bucket/delete/",
        pageDetailFile: "/bucket/detail/{bucketId}/file/{path}",
        pageDetailEdit: "/bucket/detail/{bucketId}/edit",
        pageDetailFolder: "/bucket/detail/{bucketId}/folder/{path}",
        pageFileUpload: "/bucket/detail/{bucketId}/upload/{path}",
        pageCreateFolder: "/bucket/detail/{bucketId}/folder/create/{path}",
        pageObjectDelete: "/bucket/detail/{bucketId}/delete/{path}",
        pageMemberDetail: "/bucket/detail/{bucketId}/member/",
        pageMemberEdit: "/bucket/detail/{bucketId}/member/edit/{id}",
    }

    public static SETTINGS = {
        pageMembersDetail: "/members/detail/",
        pageAddMember: "/members/add/",
        pageList: "/settings/user/list/",
        pageAdminList: "/setting-admin/list",
        pageCreate: "/settings/user/create",
        pageDelete: "/settings/user/delete/",
        pageDetailFile: "/settings/user/detail/{bucketId}/file/{path}",
        pageDetailEdit: "/settings/user/detail/{bucketId}/edit",
        pageDetailFolder: "/settings/user/detail/{bucketId}/folder/{path}",
        pageFileUpload: "/settings/user/detail/{bucketId}/upload/{path}",
        pageCreateFolder: "/settings/user/detail/{bucketId}/folder/create/{path}",
        pageObjectDelete: "/settings/user/detail/{bucketId}/delete/{path}",
        pageMemberEdit: "/settings/user/detail/{bucketId}/member/edit/{id}",
    }

    public static SECRET = {
        pageMain: "/secret",
        pageList: "/secret/list",
    }

}