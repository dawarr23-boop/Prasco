package com.prasco.mobile.ui.posts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.prasco.mobile.data.repository.CategoryRepository
import com.prasco.mobile.data.repository.PostRepository
import com.prasco.mobile.domain.model.Category
import com.prasco.mobile.domain.model.PostType
import com.prasco.mobile.domain.model.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import timber.log.Timber
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import javax.inject.Inject

@HiltViewModel
class CreatePostViewModel @Inject constructor(
    private val postRepository: PostRepository,
    private val categoryRepository: CategoryRepository
) : ViewModel() {

    private val _title = MutableStateFlow("")
    val title: StateFlow<String> = _title.asStateFlow()

    private val _content = MutableStateFlow("")
    val content: StateFlow<String> = _content.asStateFlow()

    private val _postType = MutableStateFlow(PostType.TEXT)
    val postType: StateFlow<PostType> = _postType.asStateFlow()

    private val _mediaUrl = MutableStateFlow<String?>(null)
    val mediaUrl: StateFlow<String?> = _mediaUrl.asStateFlow()

    private val _duration = MutableStateFlow(10)
    val duration: StateFlow<Int> = _duration.asStateFlow()

    private val _priority = MutableStateFlow(0)
    val priority: StateFlow<Int> = _priority.asStateFlow()

    private val _selectedCategory = MutableStateFlow<Category?>(null)
    val selectedCategory: StateFlow<Category?> = _selectedCategory.asStateFlow()

    private val _startDate = MutableStateFlow<String?>(null)
    val startDate: StateFlow<String?> = _startDate.asStateFlow()

    private val _endDate = MutableStateFlow<String?>(null)
    val endDate: StateFlow<String?> = _endDate.asStateFlow()

    private val _isActive = MutableStateFlow(true)
    val isActive: StateFlow<Boolean> = _isActive.asStateFlow()

    private val _categories = MutableStateFlow<List<Category>>(emptyList())
    val categories: StateFlow<List<Category>> = _categories.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _postCreated = MutableStateFlow(false)
    val postCreated: StateFlow<Boolean> = _postCreated.asStateFlow()

    init {
        loadCategories()
        setDefaultEndDate()
    }

    private fun loadCategories() {
        viewModelScope.launch {
            categoryRepository.getAllCategories().collect { categories ->
                _categories.value = categories
            }
        }
    }

    private fun setDefaultEndDate() {
        val now = LocalDateTime.now()
        val endDateTime = now.plusDays(7)
        val formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME
        _endDate.value = endDateTime.format(formatter)
    }

    fun updateTitle(value: String) {
        _title.value = value
    }

    fun updateContent(value: String) {
        _content.value = value
    }

    fun updatePostType(type: PostType) {
        _postType.value = type
    }

    fun updateMediaUrl(url: String?) {
        _mediaUrl.value = url
    }

    fun updateDuration(value: Int) {
        _duration.value = value.coerceIn(5, 60)
    }

    fun updatePriority(value: Int) {
        _priority.value = value.coerceIn(0, 10)
    }

    fun updateSelectedCategory(category: Category?) {
        _selectedCategory.value = category
    }

    fun updateStartDate(date: String?) {
        _startDate.value = date
    }

    fun updateEndDate(date: String?) {
        _endDate.value = date
    }

    fun updateIsActive(value: Boolean) {
        _isActive.value = value
    }

    fun createPost() {
        viewModelScope.launch {
            if (!validateInput()) {
                return@launch
            }

            _isLoading.value = true
            _errorMessage.value = null

            val result = postRepository.createPost(
                title = _title.value,
                content = _content.value,
                type = _postType.value.value,
                mediaUrl = _mediaUrl.value,
                duration = _duration.value,
                priority = _priority.value,
                categoryId = _selectedCategory.value?.id,
                startDate = _startDate.value,
                endDate = _endDate.value,
                isActive = _isActive.value
            )

            when (result) {
                is Resource.Success -> {
                    _postCreated.value = true
                    Timber.i("Post created successfully")
                }
                is Resource.Error -> {
                    _errorMessage.value = result.message
                    Timber.e("Failed to create post: ${result.message}")
                }
                is Resource.Loading -> {}
            }

            _isLoading.value = false
        }
    }

    private fun validateInput(): Boolean {
        return when {
            _title.value.isBlank() -> {
                _errorMessage.value = "Titel darf nicht leer sein"
                false
            }
            _content.value.isBlank() -> {
                _errorMessage.value = "Inhalt darf nicht leer sein"
                false
            }
            _duration.value < 5 || _duration.value > 60 -> {
                _errorMessage.value = "Anzeigedauer muss zwischen 5 und 60 Sekunden liegen"
                false
            }
            else -> true
        }
    }

    fun clearError() {
        _errorMessage.value = null
    }

    fun resetForm() {
        _title.value = ""
        _content.value = ""
        _postType.value = PostType.TEXT
        _mediaUrl.value = null
        _duration.value = 10
        _priority.value = 0
        _selectedCategory.value = null
        _startDate.value = null
        setDefaultEndDate()
        _isActive.value = true
        _postCreated.value = false
        _errorMessage.value = null
    }

    fun updatePost(
        id: Int,
        title: String,
        content: String,
        type: String,
        mediaUrl: String?,
        duration: Int,
        priority: Int,
        categoryId: Int?,
        startDate: String?,
        endDate: String?,
        isActive: Boolean
    ) {
        viewModelScope.launch {
            _createState.value = Resource.Loading()
            _createState.value = postRepository.updatePost(
                id = id,
                title = title,
                content = content,
                type = type,
                mediaUrl = mediaUrl,
                duration = duration,
                priority = priority,
                categoryId = categoryId,
                startDate = startDate,
                endDate = endDate,
                isActive = isActive
            )
        }
    }

    fun clearState() {
        _createState.value = null
    }
}
