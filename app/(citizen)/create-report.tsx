import { Button, Card, Header, Input } from "@/components/common";
import { WasteTypeSelector } from "@/components/waste";
import { AppColors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { WASTE_TYPES } from "@/data/mockData";
import { validateRequired } from "@/utils/validators";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CreateReportScreen() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState("");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ type?: string; weight?: string }>({});

  const validate = () => {
    const newErrors: { type?: string; weight?: string } = {};

    const typeError = validateRequired(selectedType, "Loại rác");
    if (typeError) newErrors.type = typeError;

    const weightError = validateRequired(weight, "Khối lượng");
    if (weightError) {
      newErrors.weight = weightError;
    } else if (parseFloat(weight) <= 0) {
      newErrors.weight = "Khối lượng phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Quyền truy cập",
          `Vui lòng cấp quyền truy cập ${useCamera ? "camera" : "thư viện ảnh"} để tải ảnh lên.`,
        );
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
          });

      if (!result.canceled) {
        const newImages = result.assets.map(
          (asset: ImagePicker.ImagePickerAsset) => asset.uri,
        );
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const showImageOptions = () => {
    Alert.alert("Thêm ảnh", "Chọn nguồn ảnh", [
      {
        text: "Chụp ảnh",
        onPress: () => pickImage(true),
      },
      {
        text: "Chọn từ thư viện",
        onPress: () => pickImage(false),
      },
      {
        text: "Hủy",
        style: "cancel",
      },
    ]);
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const wasteType = WASTE_TYPES.find((t) => t.value === selectedType);
    const estimatedPoints = Math.round(
      parseFloat(weight) * (wasteType?.points || 10),
    );

    // TODO: Upload images to server and create report with image URLs

    Alert.alert(
      "Tạo báo cáo thành công!",
      `Bạn sẽ nhận được ${estimatedPoints} điểm khi báo cáo được hoàn thành.\n\nShipper sẽ đến thu gom trong 24-48 giờ.`,
      [
        {
          text: "OK",
          onPress: () => {
            setSelectedType("");
            setWeight("");
            setDescription("");
            setImages([]);
            setErrors({});
          },
        },
      ],
    );
  };

  const estimatedPoints =
    weight && selectedType
      ? Math.round(
          parseFloat(weight || "0") *
            (WASTE_TYPES.find((t) => t.value === selectedType)?.points || 10),
        )
      : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header
        title="Tạo báo cáo rác"
        subtitle="Phân loại rác giúp môi trường sạch hơn"
        showBack={false}
      />

      <View style={styles.content}>
        {/* Address Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ thu gom</Text>
          <Card variant="elevated">
            <View style={styles.addressCard}>
              <Ionicons name="location" size={24} color={AppColors.primary} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressText}>{user?.address}</Text>
                <Text style={styles.districtText}>{user?.district}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Waste Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Loại rác <Text style={styles.required}>*</Text>
          </Text>
          <WasteTypeSelector
            selectedType={selectedType}
            onSelect={(value) => {
              setSelectedType(value);
              setErrors({ ...errors, type: undefined });
            }}
          />
          {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
        </View>

        {/* Weight Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Khối lượng (kg) <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 5.5"
              value={weight}
              onChangeText={(text) => {
                setWeight(text);
                setErrors({ ...errors, weight: undefined });
              }}
              keyboardType="decimal-pad"
              placeholderTextColor={AppColors.gray[400]}
            />
            <Text style={styles.inputUnit}>kg</Text>
          </View>
          {errors.weight && (
            <Text style={styles.errorText}>{errors.weight}</Text>
          )}

          {estimatedPoints > 0 && (
            <View style={styles.pointsEstimate}>
              <Text style={styles.estimateLabel}>Điểm dự kiến:</Text>
              <Text style={styles.estimateValue}>+{estimatedPoints} điểm</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả (tùy chọn)</Text>
          <Input
            placeholder="Ví dụ: Chai nhựa đã rửa sạch, xếp gọn trong túi..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </View>

        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hình ảnh (tùy chọn)</Text>
          <View style={styles.imagesContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={AppColors.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={showImageOptions}
              >
                <Ionicons name="camera" size={32} color={AppColors.primary} />
                <Text style={styles.addImageText}>Thêm ảnh</Text>
              </TouchableOpacity>
            )}
          </View>
          {images.length > 0 && (
            <Text style={styles.imageCount}>{images.length}/5 ảnh</Text>
          )}
        </View>

        {/* Info Card */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Ionicons name="bulb" size={24} color={AppColors.warning} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Lưu ý:</Text>
              <Text style={styles.infoText}>
                • Phân loại rác đúng loại để nhận thêm điểm{"\n"}• Rửa sạch và
                để khô trước khi đóng gói{"\n"}• Chụp ảnh rõ ràng giúp shipper
                dễ xác nhận{"\n"}• Shipper sẽ đến trong 24-48 giờ
              </Text>
            </View>
          </View>
        </Card>

        {/* Submit Button */}
        <Button title="Tạo báo cáo" onPress={handleSubmit} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  required: {
    color: AppColors.error,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 16,
    color: AppColors.textPrimary,
    fontWeight: "600",
  },
  districtText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.gray[300],
    paddingRight: 15,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: AppColors.textPrimary,
  },
  inputUnit: {
    fontSize: 16,
    color: AppColors.textSecondary,
    fontWeight: "600",
  },
  errorText: {
    color: AppColors.error,
    fontSize: 12,
    marginTop: 5,
  },
  pointsEstimate: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    padding: 12,
    backgroundColor: AppColors.warning + "20",
    borderRadius: 12,
  },
  estimateLabel: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  estimateValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: AppColors.warning,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageWrapper: {
    position: "relative",
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: AppColors.gray[200],
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: AppColors.white,
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.primary,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.primary + "10",
  },
  addImageText: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  imageCount: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 8,
    textAlign: "right",
  },
  infoCard: {
    marginBottom: 25,
    backgroundColor: AppColors.secondary + "10",
  },
  infoContent: {
    flexDirection: "row",
    gap: 12,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: AppColors.textPrimary,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
});
