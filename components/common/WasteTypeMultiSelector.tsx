import { AppColors } from '@/constants/theme';
import { WASTE_TYPES } from '@/data/mockData';
import { WasteType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WASTE_TYPE_OPTIONS = WASTE_TYPES.map(type => ({
    type: type.value as WasteType,
    label: type.label,
    icon: type.icon as keyof typeof Ionicons.glyphMap,
    color: type.color,
}));

interface WasteTypeSelectorProps {
    selectedTypes: WasteType[];
    onTypesChange: (types: WasteType[]) => void;
    label?: string;
    error?: string;
}

export function WasteTypeMultiSelector({
    selectedTypes,
    onTypesChange,
    label = 'Loại rác thu gom',
    error,
}: WasteTypeSelectorProps) {
    const toggleType = (type: WasteType) => {
        if (selectedTypes.includes(type)) {
            // Remove
            onTypesChange(selectedTypes.filter(t => t !== type));
        } else {
            // Add
            onTypesChange([...selectedTypes, type]);
        }
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View style={styles.optionsContainer}>
                {WASTE_TYPE_OPTIONS.map((option) => {
                    const isSelected = selectedTypes.includes(option.type);

                    return (
                        <TouchableOpacity
                            key={option.type}
                            activeOpacity={0.7}
                            onPress={() => toggleType(option.type)}
                            style={[
                                styles.optionCard,
                                isSelected && {
                                    backgroundColor: option.color + '15',
                                    borderColor: option.color,
                                    borderWidth: 2,
                                },
                            ]}
                        >
                            {/* Icon */}
                            <View
                                style={[
                                    styles.iconContainer,
                                    { backgroundColor: isSelected ? option.color : AppColors.gray[200] },
                                ]}
                            >
                                <Ionicons
                                    name={option.icon}
                                    size={28}
                                    color={isSelected ? AppColors.white : AppColors.textSecondary}
                                />
                            </View>

                            {/* Label */}
                            <Text
                                style={[
                                    styles.optionLabel,
                                    isSelected && { color: option.color, fontWeight: '700' },
                                ]}
                            >
                                {option.label}
                            </Text>

                            {/* Checkmark */}
                            {isSelected && (
                                <View style={[styles.checkmark, { backgroundColor: option.color }]}>
                                    <Ionicons name="checkmark" size={14} color={AppColors.white} />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: AppColors.textPrimary,
        marginBottom: 12,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    optionCard: {
        width: '48%',
        backgroundColor: AppColors.white,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: AppColors.gray[200],
        position: 'relative',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    optionLabel: {
        fontSize: 14,
        color: AppColors.textPrimary,
        textAlign: 'center',
        fontWeight: '500',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 13,
        color: AppColors.error,
        marginTop: 8,
    },
});
