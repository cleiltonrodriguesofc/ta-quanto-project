import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import { User, Trash2, Save } from 'lucide-react-native';
import { UserProfile, AVATAR_PRESETS } from '@/types/user';
import { getUserProfile, saveUserProfile, clearAllData } from '@/utils/storage';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userProfile = await getUserProfile();
    setProfile(userProfile);
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setSelectedAvatar(userProfile.avatarId);
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert(t('error'), t('enter_name_placeholder'));
      return;
    }

    const newProfile: UserProfile = {
      id: profile?.id || Date.now().toString(),
      displayName: displayName.trim(),
      avatarId: selectedAvatar,
      joinedDate: profile?.joinedDate || new Date().toISOString(),
      stats: profile?.stats || { pricesShared: 0, totalSavings: 0 },
    };

    await saveUserProfile(newProfile);
    setProfile(newProfile);
    setIsEditing(false);
    Alert.alert(t('success'), t('success')); // Or a specific message
  };

  const handleClearData = () => {
    Alert.alert(
      t('clear_all_data'),
      t('clear_data_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear'),
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            setProfile(null);
            setDisplayName('');
            setIsEditing(true);
            Alert.alert(t('data_cleared'), t('data_cleared_msg'));
          },
        },
      ]
    );
  };

  const getAvatarColor = (avatarId: string) => {
    switch (avatarId) {
      case 'avatar1': return '#3A7DE8';
      case 'avatar2': return '#10B981';
      case 'avatar3': return '#8B5CF6';
      case 'avatar4': return '#F59E0B';
      case 'avatar5': return '#EC4899';
      case 'avatar6': return '#6B7280';
      default: return '#3A7DE8';
    }
  };

  if (isEditing) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{profile ? t('edit_profile') : t('create_profile')}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.formCard}>
            <Text style={styles.label}>{t('choose_avatar')}</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_PRESETS.map((avatar) => (
                <TouchableOpacity
                  key={avatar}
                  style={[
                    styles.avatarOption,
                    { backgroundColor: getAvatarColor(avatar) },
                    selectedAvatar === avatar && styles.avatarSelected
                  ]}
                  onPress={() => setSelectedAvatar(avatar)}
                >
                  <User size={32} color="#FFFFFF" />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('display_name')}</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={t('enter_name_placeholder')}
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>{t('save_profile')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={[styles.avatarContainer, { backgroundColor: getAvatarColor(profile?.avatarId || 'avatar1') }]}>
            <User size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.profileTitle}>{profile?.displayName}</Text>
          <Text style={styles.profileSubtitle}>{t('member_since')} {new Date(profile?.joinedDate || '').toLocaleDateString()}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.stats.pricesShared || 0}</Text>
              <Text style={styles.statLabel}>{t('shared')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>R${(profile?.stats.totalSavings || 0).toFixed(2)}</Text>
              <Text style={styles.statLabel}>{t('saved')}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>{t('edit_profile')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
            <Trash2 size={24} color="#EF4444" />
            <Text style={[styles.menuText, { color: '#EF4444' }]}>{t('clear_all_data')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionCard}>
          <Text style={styles.versionText}>TaQuanto? MVP v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#3A7DE8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 20,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: '#1F2937',
    borderWidth: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#3A7DE8',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3A7DE8',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
  },
  versionCard: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});