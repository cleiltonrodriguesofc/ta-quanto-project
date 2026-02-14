import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native';
import { User, Settings, Award, TrendingUp, DollarSign, Share2, LogOut, ChevronRight, Edit2, Shield, Bell, Moon } from 'lucide-react-native';
import { UserProfile, AVATAR_PRESETS } from '@/types/user';
import { getUserProfile, saveUserProfile, clearAllData } from '@/utils/storage';
import { api } from '@/utils/api';
import { calculateNextLevelProgress } from '@/utils/gamification';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [levelInfo, setLevelInfo] = useState({ level: 1, progress: 0, totalNeeded: 50, percent: 0 });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);



  const loadProfile = useCallback(async () => {
    const userProfile = await getUserProfile(user?.id);
    setProfile(userProfile);
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setSelectedAvatar(userProfile.avatarId || 'avatar1');
      // Calculate level based on points (shared count * 10 for demo, or just use shared count)
      // Let's assume 1 share = 10 Pontos for now to make numbers look bigger/fun
      const points = (userProfile.stats?.pricesShared || 0) * 10;
      setLevelInfo(calculateNextLevelProgress(points));

      // Fetch activity
      try {
        const activity = await api.getPricesByUser(userProfile.id);
        setRecentActivity(activity);
      } catch (e) {
        console.log('Failed to load activity', e);
      }
    } else {
      setIsEditing(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login');
    } else if (user) {
      loadProfile();
    }
  }, [user, authLoading, router, loadProfile]);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3, // Lower quality for smaller file size (kb instead of mb)
    });

    if (!result.canceled) {
      setSelectedAvatar(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert(t('error'), t('enter_name_placeholder'));
      return;
    }

    setIsLoading(true);
    try {
      let finalAvatarId = selectedAvatar;

      // 1. If avatar is local, upload it
      if (isCustomAvatar(selectedAvatar) && selectedAvatar.startsWith('file://')) {
        try {
          if (profile?.id) {
            finalAvatarId = await api.uploadAvatar(profile.id, selectedAvatar);
          }
        } catch (e) {
          console.error('Avatar upload failed, using local fallback', e);
        }
      }

      const newProfile: UserProfile = {
        id: user?.id || profile?.id || Date.now().toString(),
        displayName: displayName.trim(),
        avatarId: finalAvatarId,
        joinedDate: profile?.joinedDate || new Date().toISOString(),
        stats: profile?.stats || { pricesShared: 0, totalSavings: 0, streakDays: 0, rank: 0 },
        // Initialize settings/gamification if missing
        level: levelInfo.level,
        points: (profile?.stats?.pricesShared || 0) * 10,
        settings: profile?.settings || { notifications: true, darkMode: false },
      };

      await saveUserProfile(newProfile);
      setProfile(newProfile);
      setIsEditing(false);

      // update level info
      const points = (newProfile.stats?.pricesShared || 0) * 10;
      setLevelInfo(calculateNextLevelProgress(points));

      Alert.alert(t('success'), t('success'));
    } catch (error) {
      console.error('Save profile failed', error);
      Alert.alert(t('error'), t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      t('logout'),
      t('logout_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            // 1. Supabase Sign Out
            try {
              await supabase.auth.signOut();
            } catch (e) {
              console.log('Supabase sign out error', e);
            }

            // 2. Clear Local Session
            await clearAllData();

            // 3. Reset local state
            setProfile(null);
            setDisplayName('');
            setRecentActivity([]);
            setIsEditing(true);

            // 4. Redirect to login
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  const getAvatarColor = (avatarId: string) => {
    // If it looks like a URI, return transparent or default
    if (avatarId.startsWith('file://') || avatarId.startsWith('http')) {
      return '#E5E7EB';
    }
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

  const isCustomAvatar = (avatarId: string) => {
    return avatarId.startsWith('file://') || avatarId.startsWith('http') || avatarId.startsWith('data:');
  };

  if (authLoading || !user) {
    return null;
  }

  if (isEditing) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#3A7DE8', '#2563EB']} style={styles.headerBackground} />
        <View style={styles.headerContentEdit}>
          <Text style={styles.headerTitle}>{profile ? t('edit_profile') : t('create_profile')}</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.formCard}>
            <View style={styles.avatarSelectionContainer}>
              <TouchableOpacity onPress={pickImage} style={[styles.avatarPreview, { backgroundColor: getAvatarColor(selectedAvatar), overflow: 'hidden' }]}>
                {isCustomAvatar(selectedAvatar) ? (
                  <Image source={{ uri: selectedAvatar }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <User size={48} color="#FFFFFF" />
                )}
                <View style={{ position: 'absolute', bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', width: '100%', alignItems: 'center', paddingVertical: 2 }}>
                  <Edit2 size={12} color="white" />
                </View>
              </TouchableOpacity>
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
                    {selectedAvatar === avatar && !isCustomAvatar(selectedAvatar) && <View style={styles.selectedDot} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('display_name')}</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('enter_name_placeholder')}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>{t('save_profile')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} bounces={false}>
        {/* Header Section */}
        <View style={styles.profileHeader}>
          <LinearGradient colors={['#3A7DE8', '#1E40AF']} style={styles.headerGradient}>
            <View style={styles.headerTopRow}>
              <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
                <Settings size={22} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileMainInfo}>
              <View style={styles.avatarWrapper}>
                <View style={[styles.avatarLarge, { backgroundColor: getAvatarColor(profile?.avatarId || 'avatar1'), overflow: 'hidden' }]}>
                  {profile?.avatarId && isCustomAvatar(profile.avatarId) ? (
                    <Image source={{ uri: profile.avatarId }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <User size={64} color="#FFFFFF" />
                  )}
                </View>
                <TouchableOpacity style={styles.editBadge} onPress={() => setIsEditing(true)}>
                  <Edit2 size={14} color="#3A7DE8" />
                </TouchableOpacity>
              </View>
              <Text style={styles.userName}>{profile?.displayName}</Text>
              <Text style={styles.userJoined}>{t('member_since')} {new Date(profile?.joinedDate || '').getFullYear()}</Text>

              {/* Level Progress */}
              <View style={styles.levelContainer}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>{t('level')} {levelInfo.level}</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(levelInfo.percent * 100, 100)}%` }]} />
                </View>
                <Text style={styles.pointsText}>{levelInfo.progress} / {levelInfo.totalNeeded} {t('points_unit')}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
              <Share2 size={20} color="#3A7DE8" />
            </View>
            <Text style={styles.statValue}>{profile?.stats.pricesShared || 0}</Text>
            <Text style={styles.statLabel}>{t('shared')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
              <DollarSign size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>R${(profile?.stats.totalSavings || 0).toFixed(0)}</Text>
            <Text style={styles.statLabel}>{t('saved')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FAF5FF' }]}>
              <TrendingUp size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>#{profile?.stats.rank || '-'}</Text>
            <Text style={styles.statLabel}>{t('rank')}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
              <Award size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{profile?.stats.streakDays || 0}</Text>
            <Text style={styles.statLabel}>{t('streak')}</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('recent_activity')}</Text>
          {recentActivity.length > 0 ? (
            recentActivity.map((item) => (
              <View key={item.id} style={styles.activityCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>{item.productName || 'Product'}</Text>
                  <Text style={{ fontWeight: 'bold', color: '#10B981' }}>R$ {item.price.toFixed(2)}</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>{item.supermarket} • {new Date(item.timestamp).toLocaleDateString()}</Text>
              </View>
            ))
          ) : (
            <View style={styles.activityCard}>
              <Text style={{ color: '#6B7280', textAlign: 'center', padding: 20 }}>
                {t('no_activity')}
              </Text>
            </View>
          )}
        </View>

        {/* Menu Options */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuIconBox}><Bell size={20} color="#6B7280" /></View>
              <Text style={styles.menuText}>{t('notifications')}</Text>
              <ChevronRight size={20} color="#D1D5DB" />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuIconBox}><Moon size={20} color="#6B7280" /></View>
              <Text style={styles.menuText}>{t('dark_mode')}</Text>
              <ChevronRight size={20} color="#D1D5DB" />
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuIconBox}><Shield size={20} color="#6B7280" /></View>
              <Text style={styles.menuText}>{t('privacy')}</Text>
              <ChevronRight size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>TaQuanto v1.0.0 (Build 100)</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  // Header
  profileHeader: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#3A7DE8',
    elevation: 5,
    shadowColor: '#3A7DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  profileMainInfo: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userJoined: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  levelContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  levelBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  levelText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 4,
  },
  pointsText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
    justifyContent: 'space-between',
    marginTop: -20, // Overlap header
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%', // Approx 2 columns
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Settings
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  menuIconBox: {
    width: 32,
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    marginLeft: 8,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 56,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 12,
  },

  // Edit Mode Styles
  headerBackground: {
    height: 120,
    width: '100%',
    position: 'absolute',
    top: 0,
  },
  headerContentEdit: {
    marginTop: 60,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarSelectionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 2,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  avatarOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    borderWidth: 3,
    borderColor: '#374151',
    transform: [{ scale: 1.1 }],
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
    fontSize: 18,
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#3A7DE8',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3A7DE8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
});