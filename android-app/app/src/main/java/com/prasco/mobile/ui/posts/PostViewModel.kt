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
            _isLoading.value = true
            
            when (val result = postRepository.deletePost(postId)) {
                is Resource.Success -> {
                    Timber.i("Post deleted successfully")
                }
                is Resource.Error -> {
                    _errorMessage.value = result.message
                    Timber.e("Failed to delete post: ${result.message}")
                }
                is Resource.Loading -> {}
            }
            
            _isLoading.value = false
        }
    }

    fun clearError() {
        _errorMessage.value = null
    }
}
            }
        }
    }

    fun deletePost(postId: Int) {
        viewModelScope.launch {
            _deleteState.value = Resource.Loading()
            _deleteState.value = postRepository.deletePost(postId)
        }
    }

    fun clearDeleteState() {
        _deleteState.value = null
    }

    fun getFilteredPosts(activeOnly: Boolean, categoryId: Int?): StateFlow<List<Post>> {
        return when {
            categoryId != null -> postRepository.getPostsByStatus(activeOnly)
                .map { posts -> posts.filter { it.category?.id == categoryId } }
            activeOnly -> postRepository.getPostsByStatus(true)
            else -> postRepository.getAllPosts()
        }.stateIn(viewModelScope, SharingStarted.Lazily, emptyList())
    }
}
