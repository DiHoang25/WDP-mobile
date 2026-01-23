import { AppColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export interface PickerOption {
    label: string;
    value: string;
    subLabel?: string;
}

interface MultiSelectPickerProps {
    label?: string;
    placeholder?: string;
    options: PickerOption[];
    selectedValues?: string[];
    onValuesChange: (values: string[]) => void;
    error?: string;
    disabled?: boolean;
}

export const MultiSelectPicker = ({
    label,
    placeholder = "Chọn...",
    options,
    selectedValues = [],
    onValuesChange,
    error,
    disabled = false,
}: MultiSelectPickerProps) => {
    const [modalVisible, setModalVisible] = useState(false);

    const toggleSelection = (value: string) => {
        const newValues = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onValuesChange(newValues);
    };

    const selectAll = () => {
        onValuesChange(options.map(opt => opt.value));
    };

    const clearAll = () => {
        onValuesChange([]);
    };

    const getDisplayText = () => {
        if (selectedValues.length === 0) return placeholder;
        if (selectedValues.length === options.length) return "Tất cả";
        if (selectedValues.length === 1) {
            const selected = options.find(opt => opt.value === selectedValues[0]);
            return selected?.label || placeholder;
        }
        return `Đã chọn ${selectedValues.length}`;
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TouchableOpacity
                style={[
                    styles.pickerButton,
                    error ? styles.errorBorder : null,
                    disabled ? styles.disabledButton : null,
                ]}
                onPress={() => !disabled && setModalVisible(true)}
                activeOpacity={0.7}
            >
                <Text
                    style={[
                        styles.selectedText,
                        selectedValues.length === 0 ? styles.placeholderText : null,
                    ]}
                >
                    {getDisplayText()}
                </Text>
                <Ionicons
                    name="chevron-down"
                    size={20}
                    color={AppColors.gray[500]}
                />
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.modalContent}
                        activeOpacity={1}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label || "Chọn nhiều tùy chọn"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={AppColors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.actionsRow}>
                            <TouchableOpacity onPress={selectAll} style={styles.actionButton}>
                                <Text style={styles.actionText}>Chọn tất cả</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={clearAll} style={styles.actionButton}>
                                <Text style={styles.actionText}>Bỏ chọn tất cả</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => {
                                const isSelected = selectedValues.includes(item.value);
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.optionItem,
                                            isSelected && styles.selectedOptionItem,
                                        ]}
                                        onPress={() => toggleSelection(item.value)}
                                    >
                                        <View style={styles.checkboxContainer}>
                                            <View style={[
                                                styles.checkbox,
                                                isSelected && styles.checkboxChecked
                                            ]}>
                                                {isSelected && (
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={16}
                                                        color={AppColors.white}
                                                    />
                                                )}
                                            </View>
                                            <View style={styles.resultTextContainer}>
                                                <Text
                                                    style={[
                                                        styles.optionText,
                                                        isSelected && styles.selectedOptionText,
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                                {item.subLabel && (
                                                    <Text style={styles.subLabelText}>
                                                        {item.subLabel}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            }}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            contentContainerStyle={styles.listContent}
                        />

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.doneButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.doneButtonText}>Xong ({selectedValues.length})</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: AppColors.textPrimary,
        marginBottom: 8,
    },
    pickerButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: AppColors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AppColors.gray[300],
        paddingHorizontal: 16,
        height: 50,
    },
    errorBorder: {
        borderColor: AppColors.error,
    },
    disabledButton: {
        backgroundColor: AppColors.gray[100],
        borderColor: AppColors.gray[200],
    },
    selectedText: {
        fontSize: 16,
        color: AppColors.textPrimary,
    },
    placeholderText: {
        color: AppColors.gray[400],
    },
    errorText: {
        color: AppColors.error,
        fontSize: 12,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: AppColors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "80%",
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray[200],
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: AppColors.textPrimary,
    },
    actionsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray[200],
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    actionText: {
        fontSize: 14,
        color: AppColors.primary,
        fontWeight: "600",
    },
    listContent: {
        paddingHorizontal: 20,
    },
    optionItem: {
        paddingVertical: 12,
    },
    selectedOptionItem: {
        backgroundColor: AppColors.primary + "05",
    },
    checkboxContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: AppColors.gray[400],
        marginRight: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxChecked: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    optionText: {
        fontSize: 16,
        color: AppColors.textPrimary,
    },
    selectedOptionText: {
        color: AppColors.primary,
        fontWeight: "600",
    },
    subLabelText: {
        fontSize: 12,
        color: AppColors.gray[500],
        marginTop: 2,
    },
    resultTextContainer: {
        flex: 1,
    },
    separator: {
        height: 1,
        backgroundColor: AppColors.gray[100],
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    doneButton: {
        backgroundColor: AppColors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    doneButtonText: {
        color: AppColors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
});
