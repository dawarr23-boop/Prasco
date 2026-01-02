package com.prasco.mobile.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.prasco.mobile.ui.auth.LoginScreen
import com.prasco.mobile.ui.auth.AuthViewModel
import com.prasco.mobile.ui.posts.PostListScreen
import com.prasco.mobile.ui.posts.CreatePostScreen

@Composable
fun PrascoNavHost() {
    val navController = rememberNavController()
    val authViewModel: AuthViewModel = hiltViewModel()
    val isLoggedIn by authViewModel.isLoggedIn.collectAsState()
    
    val startDestination = if (isLoggedIn) {
        Screen.PostList.route
    } else {
        Screen.Login.route
    }
    
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.PostList.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.PostList.route) {
            PostListScreen(
                onCreatePost = {
                    navController.navigate(Screen.CreatePost.route)
                },
                onPostClick = { postId ->
                    navController.navigate(Screen.PostDetail.createRoute(postId))
                },
                onEditPost = { postId ->
                    navController.navigate(Screen.EditPost.createRoute(postId))
                },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.PostList.route) { inclusive = true }
                    }
                }
            )
        }
        
        composable(Screen.CreatePost.route) {
            CreatePostScreen(
                onPostCreated = {
                    navController.popBackStack()
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
        
        composable(
            route = Screen.EditPost.route,
            arguments = listOf(
                navArgument("postId") { type = NavType.IntType }
            )
        ) { backStackEntry ->
            val postId = backStackEntry.arguments?.getInt("postId") ?: 0
            CreatePostScreen(
                postId = postId,
                onPostCreated = {
                    navController.popBackStack()
                },
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
