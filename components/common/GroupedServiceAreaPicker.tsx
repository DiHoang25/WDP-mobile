import { AppColors } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

interface LocationItem {
    code: string;
    name: string;
}

interface DistrictItem extends LocationItem {
    provinceName?: string;
    provinceCode?: string;
}

interface WardItem extends LocationItem {
    districtName?: string;
    districtCode?: string;
    provinceCode?: string;
}

interface ProvinceGroup {
    code: string;
    name: string;
}

interface GroupedServiceAreaPickerProps {
    /** Selected provinces to group by */
    provinces: ProvinceGroup[];
    /** All loaded districts (with provinceCode attached) */
    districts: DistrictItem[];
    /** All loaded wards (with districtCode attached) */
    wards: WardItem[];
    /** Currently selected district IDs */
    selectedDistrictIds: string[];
    /** Currently selected ward IDs */
    selectedWardIds: string[];
    /** Callback when district selection changes */
    onDistrictsChange: (ids: string[]) => void;
    /** Callback when ward selection changes */
    onWardsChange: (ids: string[]) => void;
    /** Labels */
    districtLabel?: string;
    wardLabel?: string;
    /** Error message */
    error?: string;
}

export const GroupedServiceAreaPicker = ({
    provinces,
    districts,
    wards,
    selectedDistrictIds,
    selectedWardIds,
    onDistrictsChange,
    onWardsChange,
    districtLabel = "Quận / Huyện",
    wardLabel = "Phường / Xã",
    error,
}: GroupedServiceAreaPickerProps) => {
    const { t } = useLanguage();
    // Track which province cards are expanded
    const [expandedProvinces, setExpandedProvinces] = useState<Record<string, boolean>>({});
    // Track which district ward-groups are expanded
    const [expandedDistricts, setExpandedDistricts] = useState<Record<string, boolean>>({});

    const toggleProvinceExpand = (code: string) => {
        setExpandedProvinces(prev => ({ ...prev, [code]: !prev[code] }));
    };

    const toggleDistrictExpand = (code: string) => {
        setExpandedDistricts(prev => ({ ...prev, [code]: !prev[code] }));
    };

    // Get districts for a specific province
    const getDistrictsForProvince = (provinceCode: string) => {
        return districts.filter(d => d.provinceCode === provinceCode);
    };

    // Get wards for a specific district
    const getWardsForDistrict = (districtCode: string) => {
        return wards.filter(w => w.districtCode === districtCode);
    };

    // Toggle a single district
    const toggleDistrict = (districtCode: string) => {
        const newIds = selectedDistrictIds.includes(districtCode)
            ? selectedDistrictIds.filter(id => id !== districtCode)
            : [...selectedDistrictIds, districtCode];
        onDistrictsChange(newIds);

        // If deselecting a district, remove its wards too
        if (selectedDistrictIds.includes(districtCode)) {
            const wardsToRemove = wards
                .filter(w => w.districtCode === districtCode)
                .map(w => w.code);
            onWardsChange(selectedWardIds.filter(id => !wardsToRemove.includes(id)));
        }
    };

    // Toggle all districts in a province
    const toggleAllDistrictsInProvince = (provinceCode: string) => {
        const provinceDistricts = getDistrictsForProvince(provinceCode);
        const provinceDCodes = provinceDistricts.map(d => d.code);
        const allSelected = provinceDCodes.every(code => selectedDistrictIds.includes(code));

        if (allSelected) {
            // Deselect all districts of this province
            const newDistrictIds = selectedDistrictIds.filter(id => !provinceDCodes.includes(id));
            onDistrictsChange(newDistrictIds);
            // Also remove all wards of these districts
            const wardsToRemove = wards
                .filter(w => provinceDCodes.includes(w.districtCode || ""))
                .map(w => w.code);
            onWardsChange(selectedWardIds.filter(id => !wardsToRemove.includes(id)));
        } else {
            // Select all districts of this province
            const newDistrictIds = [...new Set([...selectedDistrictIds, ...provinceDCodes])];
            onDistrictsChange(newDistrictIds);
        }
    };

    // Toggle a single ward
    const toggleWard = (wardCode: string) => {
        const newIds = selectedWardIds.includes(wardCode)
            ? selectedWardIds.filter(id => id !== wardCode)
            : [...selectedWardIds, wardCode];
        onWardsChange(newIds);
    };

    // Toggle all wards in a district
    const toggleAllWardsInDistrict = (districtCode: string) => {
        const districtWards = getWardsForDistrict(districtCode);
        const wardCodes = districtWards.map(w => w.code);
        const allSelected = wardCodes.every(code => selectedWardIds.includes(code));

        if (allSelected) {
            onWardsChange(selectedWardIds.filter(id => !wardCodes.includes(id)));
        } else {
            onWardsChange([...new Set([...selectedWardIds, ...wardCodes])]);
        }
    };

    // Count selected districts and wards for a province
    const getProvinceStats = (provinceCode: string) => {
        const pDistricts = getDistrictsForProvince(provinceCode);
        const selectedCount = pDistricts.filter(d => selectedDistrictIds.includes(d.code)).length;
        return { total: pDistricts.length, selected: selectedCount };
    };

    if (provinces.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionLabel}>{districtLabel} & {wardLabel}</Text>

            {provinces.map(province => {
                const isExpanded = expandedProvinces[province.code] !== false; // Default expanded
                const stats = getProvinceStats(province.code);
                const provinceDistricts = getDistrictsForProvince(province.code);
                const allDistrictsSelected = stats.total > 0 && stats.selected === stats.total;

                return (
                    <View key={province.code} style={styles.provinceCard}>
                        {/* Province Header */}
                        <TouchableOpacity
                            style={styles.provinceHeader}
                            onPress={() => toggleProvinceExpand(province.code)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.provinceHeaderLeft}>
                                <View style={styles.provinceIcon}>
                                    <Ionicons name="location" size={16} color={AppColors.primary} />
                                </View>
                                <View style={styles.provinceHeaderText}>
                                    <Text style={styles.provinceName}>{province.name}</Text>
                                    <Text style={styles.provinceStats}>
                                        {stats.selected > 0
                                            ? t("registerEnterprise.selectedDistricts", { count: stats.selected, total: stats.total })
                                            : t("registerEnterprise.districtsCount", { count: stats.total })}
                                    </Text>
                                </View>
                            </View>
                            <Ionicons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={AppColors.gray[500]}
                            />
                        </TouchableOpacity>

                        {/* Expanded Content: Districts */}
                        {isExpanded && (
                            <View style={styles.provinceContent}>
                                {/* Select All for this province */}
                                {provinceDistricts.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.selectAllRow}
                                        onPress={() => toggleAllDistrictsInProvince(province.code)}
                                    >
                                        <View style={[
                                            styles.checkbox,
                                            allDistrictsSelected && styles.checkboxChecked
                                        ]}>
                                            {allDistrictsSelected && (
                                                <Ionicons name="checkmark" size={14} color={AppColors.white} />
                                            )}
                                        </View>
                                        <Text style={styles.selectAllText}>
                                            {allDistrictsSelected ? t("registerEnterprise.deselectAll") : t("registerEnterprise.selectAllDistricts")}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* District List */}
                                {provinceDistricts.map(district => {
                                    const isDistrictSelected = selectedDistrictIds.includes(district.code);
                                    const districtWards = getWardsForDistrict(district.code);
                                    const isDistrictExpanded = expandedDistricts[district.code] || false;
                                    const selectedWardCount = districtWards.filter(w =>
                                        selectedWardIds.includes(w.code)
                                    ).length;

                                    return (
                                        <View key={district.code}>
                                            {/* District Row */}
                                            <View style={styles.districtRow}>
                                                <TouchableOpacity
                                                    style={styles.districtCheckArea}
                                                    onPress={() => toggleDistrict(district.code)}
                                                >
                                                    <View style={[
                                                        styles.checkbox,
                                                        isDistrictSelected && styles.checkboxChecked
                                                    ]}>
                                                        {isDistrictSelected && (
                                                            <Ionicons name="checkmark" size={14} color={AppColors.white} />
                                                        )}
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[
                                                            styles.districtName,
                                                            isDistrictSelected && styles.districtNameSelected
                                                        ]}>
                                                            {district.name}
                                                        </Text>
                                                        {isDistrictSelected && selectedWardCount > 0 && (
                                                            <Text style={styles.wardCountText}>
                                                                {t("registerEnterprise.wardsSelected", { count: selectedWardCount })}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </TouchableOpacity>

                                                {/* Expand wards button (only if district is selected and has wards) */}
                                                {isDistrictSelected && districtWards.length > 0 && (
                                                    <TouchableOpacity
                                                        style={styles.expandWardsBtn}
                                                        onPress={() => toggleDistrictExpand(district.code)}
                                                    >
                                                        <Text style={styles.expandWardsText}>
                                                            {wardLabel}
                                                        </Text>
                                                        <Ionicons
                                                            name={isDistrictExpanded ? "chevron-up" : "chevron-down"}
                                                            size={16}
                                                            color={AppColors.primary}
                                                        />
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            {/* Ward Sub-List */}
                                            {isDistrictSelected && isDistrictExpanded && districtWards.length > 0 && (
                                                <View style={styles.wardContainer}>
                                                    {/* Select all wards in this district */}
                                                    <TouchableOpacity
                                                        style={styles.wardSelectAllRow}
                                                        onPress={() => toggleAllWardsInDistrict(district.code)}
                                                    >
                                                        <View style={[
                                                            styles.checkboxSmall,
                                                            districtWards.every(w => selectedWardIds.includes(w.code)) && styles.checkboxSmallChecked
                                                        ]}>
                                                            {districtWards.every(w => selectedWardIds.includes(w.code)) && (
                                                                <Ionicons name="checkmark" size={12} color={AppColors.white} />
                                                            )}
                                                        </View>
                                                        <Text style={styles.wardSelectAllText}>{t("registerEnterprise.selectAll")}</Text>
                                                    </TouchableOpacity>

                                                    {districtWards.map(ward => {
                                                        const isWardSelected = selectedWardIds.includes(ward.code);
                                                        return (
                                                            <TouchableOpacity
                                                                key={ward.code}
                                                                style={styles.wardRow}
                                                                onPress={() => toggleWard(ward.code)}
                                                            >
                                                                <View style={[
                                                                    styles.checkboxSmall,
                                                                    isWardSelected && styles.checkboxSmallChecked
                                                                ]}>
                                                                    {isWardSelected && (
                                                                        <Ionicons name="checkmark" size={12} color={AppColors.white} />
                                                                    )}
                                                                </View>
                                                                <Text style={[
                                                                    styles.wardName,
                                                                    isWardSelected && styles.wardNameSelected
                                                                ]}>
                                                                    {ward.name}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}

                                {provinceDistricts.length === 0 && (
                                    <Text style={styles.emptyText}>{t("registerEnterprise.loadingDistricts")}</Text>
                                )}
                            </View>
                        )}
                    </View>
                );
            })}

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: AppColors.textPrimary,
        marginBottom: 10,
    },
    provinceCard: {
        backgroundColor: AppColors.white,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: AppColors.gray[200],
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    provinceHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: AppColors.primary + "08",
    },
    provinceHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    provinceIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: AppColors.primary + "18",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    provinceHeaderText: {
        flex: 1,
    },
    provinceName: {
        fontSize: 15,
        fontWeight: "700",
        color: AppColors.textPrimary,
    },
    provinceStats: {
        fontSize: 12,
        color: AppColors.textSecondary,
        marginTop: 2,
    },
    provinceContent: {
        paddingHorizontal: 12,
        paddingBottom: 8,
    },
    selectAllRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray[100],
    },
    selectAllText: {
        fontSize: 13,
        color: AppColors.primary,
        fontWeight: "600",
        marginLeft: 10,
    },
    districtRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray[50],
    },
    districtCheckArea: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    districtName: {
        fontSize: 14,
        color: AppColors.textPrimary,
    },
    districtNameSelected: {
        color: AppColors.primary,
        fontWeight: "600",
    },
    wardCountText: {
        fontSize: 11,
        color: AppColors.textSecondary,
        marginTop: 2,
    },
    expandWardsBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: AppColors.primary + "10",
        borderRadius: 8,
        gap: 4,
    },
    expandWardsText: {
        fontSize: 12,
        color: AppColors.primary,
        fontWeight: "600",
    },
    wardContainer: {
        backgroundColor: AppColors.gray[50],
        marginLeft: 20,
        marginRight: 4,
        marginBottom: 8,
        borderRadius: 12,
        padding: 10,
        borderLeftWidth: 3,
        borderLeftColor: AppColors.primary + "40",
    },
    wardSelectAllRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 4,
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.gray[200],
    },
    wardSelectAllText: {
        fontSize: 12,
        color: AppColors.primary,
        fontWeight: "600",
        marginLeft: 8,
    },
    wardRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 7,
        paddingHorizontal: 4,
    },
    wardName: {
        fontSize: 13,
        color: AppColors.textPrimary,
        marginLeft: 8,
    },
    wardNameSelected: {
        color: AppColors.primary,
        fontWeight: "600",
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: AppColors.gray[400],
        marginRight: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxChecked: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    checkboxSmall: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: AppColors.gray[400],
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxSmallChecked: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    emptyText: {
        fontSize: 13,
        color: AppColors.textSecondary,
        fontStyle: "italic",
        textAlign: "center",
        paddingVertical: 16,
    },
    errorText: {
        color: AppColors.error,
        fontSize: 12,
        marginTop: 4,
    },
});
