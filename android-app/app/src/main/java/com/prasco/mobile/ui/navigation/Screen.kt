package com.prasco.mobile.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object PostList : Screen("post_list")
    object CreatePost : Screen("create_post")
    object EditPost : Screen("edit_post/{postId}") {
        fun createRoute(postId: Int) = "edit_post/$postId"
    }
    object PostDetail : Screen("post_detail/{postId}") {
        fun createRoute(postId: Int) = "post_detail/$postId"
    }
    object Categories : Screen("categories")
    object Settings : Screen("settings")
}
