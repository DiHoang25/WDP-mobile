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
}

interface PickerProps {
    label?: string;
    placeholder?: string;
    options: PickerOption[];
    selectedValue?: string;
    onValueChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
}

export const Picker = ({
    label,
    placeholder = "Chọn một tùy chọn",
    options,
    selectedValue,
    onValueChange,
    error,
    disabled = false,
}: PickerProps) => {
    const [modalVisible, setModalVisible] = useState(false);

    const selectedOption = options.find((opt) => opt.value === selectedValue);

    const handleSelect = (value: string) => {
        onValueChange(value);
        setModalVisible(false);
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
                        !selectedValue ? styles.placeholderText : null,
                    ]}
                >
                    {selectedOption ? selectedOption.label : placeholder}
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
                            <Text style={styles.modalTitle}>{label || "Chọn một tùy chọn"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={AppColors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.optionItem,
                                        selectedValue === item.value && styles.selectedOptionItem,
                                    ]}
                                    onPress={() => handleSelect(item.value)}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            selectedValue === item.value && styles.selectedOptionText,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    {selectedValue === item.value && (
                                        <Ionicons
                                            name="checkmark"
                                            size={20}
                                            color={AppColors.primary}
                                        />
                                    )}
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            contentContainerStyle={styles.listContent}
                        />
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
    listContent: {
        paddingHorizontal: 20,
    },
    optionItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
    },
    selectedOptionItem: {
        backgroundColor: AppColors.primary + "05",
    },
    optionText: {
        fontSize: 16,
        color: AppColors.textPrimary,
    },
    selectedOptionText: {
        color: AppColors.primary,
        fontWeight: "600",
    },
    separator: {
        height: 1,
        backgroundColor: AppColors.gray[100],
    },
});
