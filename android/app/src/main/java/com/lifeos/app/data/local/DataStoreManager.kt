package com.lifeos.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "lifeos_prefs")

class DataStoreManager(private val context: Context) {

    companion object {
        private val JWT_TOKEN_KEY = stringPreferencesKey("jwt_token")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
    }

    val authToken: Flow<String?> = context.dataStore.data.map { prefs ->
        prefs[JWT_TOKEN_KEY]
    }

    val userName: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[USER_NAME_KEY] ?: "User Life OS"
    }

    suspend fun saveUserSession(token: String, id: String, name: String, email: String) {
        context.dataStore.edit { prefs ->
            prefs[JWT_TOKEN_KEY] = token
            prefs[USER_ID_KEY] = id
            prefs[USER_NAME_KEY] = name
            prefs[USER_EMAIL_KEY] = email
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { prefs ->
            prefs.clear()
        }
    }
}
