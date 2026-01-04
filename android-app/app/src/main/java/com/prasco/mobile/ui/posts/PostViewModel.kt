package com.prasco.mobile.ui.posts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.prasco.mobile.data.repository.CategoryRepository
import com.prasco.mobile.data.repository.PostRepository
import com.prasco.mobile.domain.model.Category
import com.prasco.mobile.domain.model.Post
import com.prasco.mobile.domain.model.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class PostViewModel @Inject constructor(
    private val postRepository: PostRepository,
    private val categoryRepository: CategoryRepository
) : ViewModel() {

    private val _posts = MutableStateFlow<List<Post>>(emptyList())
    val posts: StateFlow<List<Post>> = _posts.asStateFlow()

    private val _categories = MutableStateFlow<List<Category>>(emptyList())
    val categories: StateFlow<List<Category>> = _categories.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    private val _filterActive = MutableStateFlow<Boolean?>(null)

    private val _syncState = MutableStateFlow<Resource<Unit>?>(null)
    val syncState: StateFlow<Resource<Unit>?> = _syncState.asStateFlow()

    private val _deleteState = MutableStateFlow<Resource<Unit>?>(null)
    val deleteState: StateFlow<Resource<Unit>?> = _deleteState.asStateFlow()

    init {
        loadPosts()
        loadCategories()
    }

    private fun loadPosts() {
        viewModelScope.launch {
            combine(
                postRepository.getAllPosts(),
                _searchQuery,
                _filterActive
            ) { posts, query, filterActive ->
                posts.filter { post ->
                    val matchesQuery = if (query.isBlank()) {
                        true
                    } else {
                        post.title.contains(query, ignoreCase = true) ||
                        post.content.contains(query, ignoreCase = true)
                    }
                    
                    val matchesFilter = when (filterActive) {
                        null -> true
                        else -> post.isActive == filterActive
                    }
                    
                    matchesQuery && matchesFilter
                }
            }.collect { filteredPosts ->
                _posts.value = filteredPosts
            }
        }
    }

    private fun loadCategories() {
        viewModelScope.launch {
            categoryRepository.getAllCategories().collect { categories ->
                _categories.value = categories
            }
        }
    }

    fun syncPosts() {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            
            when (val result = postRepository.syncPosts()) {
                is Resource.Success -> {
                    Timber.i("Posts synced successfully")
                }
                is Resource.Error -> {
                    _errorMessage.value = result.message
                    Timber.e("Failed to sync posts: ${result.message}")
                }
                is Resource.Loading -> {}
            }
            
            _isLoading.value = false
        }
    }

    fun syncData() {
        viewModelScope.launch {
            _syncState.value = Resource.Loading()
            
            when (val result = postRepository.syncPosts()) {
                is Resource.Success -> {
                    _syncState.value = Resource.Success(Unit)
                    Timber.i("Data synced successfully")
                }
                is Resource.Error -> {
                    _syncState.value = Resource.Error(result.message ?: "Sync failed")
                    Timber.e("Failed to sync data: ${result.message}")
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun syncCategories() {
        viewModelScope.launch {
            when (val result = categoryRepository.syncCategories()) {
                is Resource.Success -> {
                    Timber.i("Categories synced successfully")
                }
                is Resource.Error -> {
                    Timber.e("Failed to sync categories: ${result.message}")
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun searchPosts(query: String) {
        _searchQuery.value = query
    }

    fun filterByStatus(isActive: Boolean?) {
        _filterActive.value = isActive
    }

    fun deletePost(postId: Int) {
        viewModelScope.launch {
            _deleteState.value = Resource.Loading()
            
            when (val result = postRepository.deletePost(postId)) {
                is Resource.Success -> {
                    _deleteState.value = Resource.Success(Unit)
                    Timber.i("Post deleted successfully")
                }
                is Resource.Error -> {
                    _deleteState.value = Resource.Error(result.message ?: "Delete failed")
                    Timber.e("Failed to delete post: ${result.message}")
                }
                is Resource.Loading -> {}
            }
        }
    }

    fun clearDeleteState() {
        _deleteState.value = null
    }

    fun clearError() {
        _errorMessage.value = null
    }
}
