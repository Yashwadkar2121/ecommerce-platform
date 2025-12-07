import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Edit2,
  Save,
  X,
  CheckCircle,
  Lock,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  loadUser,
  updateProfile,
  changePassword,
  clearError,
  updateUserProfile,
} from "../store/slices/authSlice";

const Profile = () => {
  const { user, isLoading, error, updateSuccess, changePasswordSuccess } =
    useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [formErrors, setFormErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch profile data on component mount
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  // Clear errors when switching modes
  useEffect(() => {
    if (!isEditing) {
      setFormErrors({
        firstName: "",
        lastName: "",
        phone: "",
      });
    }
  }, [isEditing]);

  // Handle success messages
  useEffect(() => {
    if (updateSuccess) {
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  }, [updateSuccess]);

  useEffect(() => {
    if (changePasswordSuccess) {
      setSuccessMessage("Password changed successfully!");
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  }, [changePasswordSuccess]);

  // Format phone input to only allow digits and limit to 10
  const formatPhone = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");
    // Limit to 10 digits
    return digits.slice(0, 10);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format phone input
    if (name === "phone") {
      formattedValue = formatPhone(value);
    }

    setFormData({
      ...formData,
      [name]: formattedValue,
    });

    // Clear errors when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }

    // Clear server error when user types
    if (error) {
      dispatch(clearError());
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });

    // Clear errors when user types
    if (passwordErrors[e.target.name]) {
      setPasswordErrors({
        ...passwordErrors,
        [e.target.name]: "",
      });
    }
  };

  // Validate profile form
  const validateProfile = () => {
    const errors = {};
    let isValid = true;

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
      isValid = false;
    } else if (formData.firstName.length < 2) {
      errors.firstName = "First name must be at least 2 characters";
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
      isValid = false;
    } else if (formData.lastName.length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
      isValid = false;
    }

    // Phone validation - exactly 10 digits
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      errors.phone = "Phone number must be exactly 10 digits";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const validatePassword = () => {
    const errors = {};
    let isValid = true;

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
      isValid = false;
    }

    if (!passwordData.newPassword.trim()) {
      errors.newPassword = "New password is required";
      isValid = false;
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password";
      isValid = false;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null, // Send null if phone is empty
      };

      const result = await dispatch(updateProfile(updateData)).unwrap();

      // Update local user state immediately
      dispatch(updateUserProfile(updateData));
      setIsEditing(false);
    } catch (error) {
      // Error is handled by Redux
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    try {
      await dispatch(
        changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        })
      ).unwrap();
    } catch (error) {
      // Error is handled by Redux
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
    setIsEditing(false);
    setFormErrors({
      firstName: "",
      lastName: "",
      phone: "",
    });
    dispatch(clearError());
  };

  const handleCancelPassword = () => {
    setShowPasswordForm(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    dispatch(clearError());
  };

  // Helper to get input classes based on field state
  const getInputClasses = (fieldName) => {
    const baseClasses =
      "w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ";

    if (formErrors[fieldName]) {
      return baseClasses + "border-red-300";
    }

    return baseClasses + "border-gray-300";
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg"
          >
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>{successMessage}</span>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <p className="text-primary-100">{user?.email}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="bg-white/20 text-black px-4 py-2 rounded-lg hover:bg-white/30 transition-colors font-semibold flex items-center space-x-2"
                >
                  <Lock size={18} />
                  <span>Change Password</span>
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center space-x-2"
                >
                  {isEditing ? (
                    <>
                      <X size={18} />
                      <span>Cancel</span>
                    </>
                  ) : (
                    <>
                      <Edit2 size={18} />
                      <span>Edit Profile</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Password Change Form */}
          {showPasswordForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="px-6 py-6 border-b border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      passwordErrors.currentPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter current password"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      passwordErrors.newPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Enter new password (min. 6 characters)"
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      passwordErrors.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Confirm new password"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelPassword}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="px-6 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Lock size={18} />
                    <span>{isLoading ? "Updating..." : "Update Password"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Profile Content */}
          <div className="p-6">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Personal Information
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={getInputClasses("firstName")}
                          placeholder="Enter first name"
                        />
                        {formErrors.firstName && (
                          <AlertCircle
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                            size={18}
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900">{user?.firstName}</p>
                    )}
                    {formErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={getInputClasses("lastName")}
                          placeholder="Enter last name"
                        />
                        {formErrors.lastName && (
                          <AlertCircle
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                            size={18}
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900">{user?.lastName}</p>
                    )}
                    {formErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Mail size={16} className="mr-2" />
                    Email
                  </label>
                  <p className="text-gray-900">{user?.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Phone size={16} className="mr-2" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <div>
                      <div className="relative">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={getInputClasses("phone")}
                          placeholder="1234567890"
                          maxLength="10"
                        />
                        {formErrors.phone && (
                          <AlertCircle
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500"
                            size={18}
                          />
                        )}
                      </div>
                      {formErrors.phone ? (
                        <p className="mt-1 text-sm text-red-600">
                          {formErrors.phone}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">
                          {formData.phone.length === 10 ? (
                            <span className="text-green-600">
                              ✓ Valid 10-digit phone number
                            </span>
                          ) : (
                            "Enter exactly 10 digits (no spaces or special characters)"
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900">
                      {user?.phone ? (
                        <span className="flex items-center">
                          {user.phone}
                          {/^[0-9]{10}$/.test(user.phone) && (
                            <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                          )}
                        </span>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  )}
                </div>

                {/* Member Since Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar size={16} className="mr-2" />
                    Member Since
                  </label>
                  <p className="text-gray-900">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200"
                >
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="px-6 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save size={18} />
                    <span>{isLoading ? "Saving..." : "Save Changes"}</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
