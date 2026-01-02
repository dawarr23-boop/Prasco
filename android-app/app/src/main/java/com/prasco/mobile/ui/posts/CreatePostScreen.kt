package com.prasco.mobile.ui.posts

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.prasco.mobile.domain.model.Resource

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatePostScreen(
    postId: Int? = null,
    onPostCreated: () -> Unit,
    onNavigateBack: () -> Unit,
    viewModel: CreatePostViewModel = hiltViewModel(),
    listViewModel: PostViewModel = hiltViewModel()
) {
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var type by remember { mutableStateOf("text") }
    var duration by remember { mutableStateOf("10") }
    var priority by remember { mutableStateOf("0") }
    var selectedCategoryId by remember { mutableStateOf<Int?>(null) }
    var isActive by remember { mutableStateOf(true) }
    
    val categories by listViewModel.categories.collectAsState()
    val createState by viewModel.createState.collectAsState()
    
    var showCategoryDropdown by remember { mutableStateOf(false) }
    
    LaunchedEffect(createState) {
        if (createState is Resource.Success) {
            onPostCreated()
            viewModel.clearState()
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (postId == null) "Neuer Post" else "Post bearbeiten") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Zurück")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Titel") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            OutlinedTextField(
                value = content,
                onValueChange = { content = it },
                label = { Text("Inhalt") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                maxLines = 10
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            ExposedDropdownMenuBox(
                expanded = showCategoryDropdown,
                onExpandedChange = { showCategoryDropdown = it }
            ) {
                OutlinedTextField(
                    value = categories.find { it.id == selectedCategoryId }?.name ?: "Keine Kategorie",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Kategorie") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = showCategoryDropdown) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor()
                )
                ExposedDropdownMenu(
                    expanded = showCategoryDropdown,
                    onDismissRequest = { showCategoryDropdown = false }
                ) {
                    DropdownMenuItem(
                        text = { Text("Keine Kategorie") },
                        onClick = {
                            selectedCategoryId = null
                            showCategoryDropdown = false
                        }
                    )
                    categories.forEach { category ->
                        DropdownMenuItem(
                            text = { Text(category.name) },
                            onClick = {
                                selectedCategoryId = category.id
                                showCategoryDropdown = false
                            }
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = duration,
                    onValueChange = { duration = it },
                    label = { Text("Dauer (Sek.)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = priority,
                    onValueChange = { priority = it },
                    label = { Text("Priorität") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                Text("Post aktiv", style = MaterialTheme.typography.bodyLarge)
                Switch(
                    checked = isActive,
                    onCheckedChange = { isActive = it }
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = {
                    if (title.isNotBlank() && content.isNotBlank()) {
                        if (postId == null) {
                            viewModel.createPost(
                                title = title,
                                content = content,
                                type = type,
                                mediaUrl = null,
                                duration = duration.toIntOrNull() ?: 10,
                                priority = priority.toIntOrNull() ?: 0,
                                categoryId = selectedCategoryId,
                                startDate = null,
                                endDate = null,
                                isActive = isActive
                            )
                        } else {
                            viewModel.updatePost(
                                id = postId,
                                title = title,
                                content = content,
                                type = type,
                                mediaUrl = null,
                                duration = duration.toIntOrNull() ?: 10,
                                priority = priority.toIntOrNull() ?: 0,
                                categoryId = selectedCategoryId,
                                startDate = null,
                                endDate = null,
                                isActive = isActive
                            )
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = createState !is Resource.Loading
            ) {
                if (createState is Resource.Loading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text(if (postId == null) "Post erstellen" else "Post aktualisieren")
                }
            }
            
            if (createState is Resource.Error) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = (createState as Resource.Error).message ?: "Fehler beim Speichern",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}
