import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, logout, fetchUserData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");

  useEffect(() => {
    console.log("Current user data:", user);
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      }));
      setOriginalEmail(user.email || "");
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Check if email has changed
    if (formData.email !== originalEmail) {
      setNewEmail(formData.email);
      setFormData((prev) => ({ ...prev, email: originalEmail })); // Reset to original email
      setIsVerifying(true);

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/verify-email-change`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ newEmail: formData.email }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          showMessage("success", "Verification code sent to new email address");
        } else {
          throw new Error(data.message || "Failed to send verification code");
        }
      } catch (error) {
        showMessage("error", error.message);
        setIsVerifying(false);
      }
      setIsLoading(false);
      return;
    }

    // Validate passwords if trying to change them
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        showMessage("error", "New passwords don't match");
        setIsLoading(false);
        return;
      }
      if (!formData.currentPassword) {
        showMessage(
          "error",
          "Current password is required to set a new password"
        );
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        await fetchUserData();
        showMessage("success", "Profile updated successfully");
        setIsEditing(false);
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/confirm-email-change`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            code: verificationCode,
            newEmail,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showMessage("success", "Email updated successfully");
        setIsVerifying(false);
        setVerificationCode("");
        setFormData((prev) => ({ ...prev, email: newEmail }));
        setOriginalEmail(newEmail);
        await fetchUserData();
      } else {
        throw new Error(data.message || "Invalid verification code");
      }
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/auth/delete-account`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          logout();
        } else {
          const data = await response.json();
          showMessage("error", data.message || "Failed to delete account");
        }
      } catch (error) {
        showMessage("error", "An error occurred. Please try again.");
      }
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-in-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 text-sm text-purple-400 hover:text-purple-300"
            >
              Edit Account Details
            </button>
          )}
        </div>

        {message.text && (
          <div
            className={`px-6 py-4 ${
              message.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {isVerifying ? (
          <form onSubmit={handleVerifyEmail} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">
                  Verification Code
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Enter the verification code sent to {newEmail}
                </p>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsVerifying(false);
                  setVerificationCode("");
                }}
                className="text-sm text-gray-400 hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white disabled:opacity-50 p-2"
                  required
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white disabled:opacity-50 p-2"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white disabled:opacity-50 p-2"
                  required
                />
              </div>

              {isEditing && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-400">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
                    />
                  </div>
                </>
              )}
            </div>

            {isEditing && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 focus:outline-none"
                >
                  Delete Account
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
