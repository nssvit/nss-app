"use client";

import { useState } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import Image from "next/image";

export function ProfilePage() {
  const layout = useResponsiveLayout();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile data
  const [profileData, setProfileData] = useState({
    name: "Prof. Rakshak Sood",
    email: "rakshak.sood@vit.ac.in",
    phone: "+91 9876543210",
    designation: "NSS Programme Officer",
    department: "Computer Science",
    joinDate: "January 2020",
    bio: "Passionate about social service and student development. Leading NSS activities at VIT for over 4 years.",
    location: "Vellore, Tamil Nadu",
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    eventReminders: true,
    newsletter: true,
    darkMode: true,
    language: "en",
  });

  const stats = {
    eventsOrganized: 245,
    volunteersManaged: 1847,
    hoursLogged: 12486,
    achievements: 18,
  };

  const recentActivity = [
    {
      action: "Created event",
      item: "Digital Literacy Workshop",
      time: "2 hours ago",
      icon: "fas fa-plus-circle",
      color: "text-green-400",
    },
    {
      action: "Approved volunteer",
      item: "Sneha Reddy",
      time: "1 day ago",
      icon: "fas fa-user-check",
      color: "text-blue-400",
    },
    {
      action: "Generated report",
      item: "Monthly Summary",
      time: "3 days ago",
      icon: "fas fa-file-alt",
      color: "text-purple-400",
    },
    {
      action: "Updated settings",
      item: "Notification preferences",
      time: "1 week ago",
      icon: "fas fa-cog",
      color: "text-orange-400",
    },
  ];

  const tabs = [
    { id: "profile", name: "Profile", icon: "fas fa-user" },
    { id: "activity", name: "Activity", icon: "fas fa-chart-line" },
    { id: "preferences", name: "Preferences", icon: "fas fa-sliders-h" },
  ];

  const handleSave = () => {
    console.log("Profile saved");
  };

  return (
    <div
      className={`flex-1 overflow-x-hidden overflow-y-auto main-content-bg mobile-scroll safe-area-bottom ${layout.getContentPadding()}`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="card-glass rounded-xl p-6 mb-6">
          <div
            className={`flex ${layout.isMobile ? "flex-col" : "flex-row"} items-center gap-6`}
          >
            <div className="relative">
              <Image
                src="https://res.cloudinary.com/du6zyqqyw/image/upload/f_auto,q_auto,w_128/v1740560606/img/2024-2025/team/rakshaksood.jpg"
                alt="Profile Picture"
                width={layout.isMobile ? 96 : 128}
                height={layout.isMobile ? 96 : 128}
                className={`${layout.isMobile ? "w-24 h-24" : "w-32 h-32"} rounded-full border-4 border-gray-700/50`}
              />
              <button className="absolute bottom-0 right-0 pwa-button bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg focus-visible">
                <i className="fas fa-camera text-sm"></i>
              </button>
            </div>

            <div
              className={`flex-1 ${layout.isMobile ? "text-center" : "text-left"}`}
            >
              <h1
                className={`${layout.isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-100 mb-2`}
              >
                {profileData.name}
              </h1>
              <p className="text-lg text-gray-300 mb-2">
                {profileData.designation}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                {profileData.department} • {profileData.location}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  <i className="fas fa-calendar mr-1"></i> Joined{" "}
                  {profileData.joinDate}
                </span>
                <span>
                  <i className="fas fa-envelope mr-1"></i> {profileData.email}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="pwa-button button-glass-primary hover-lift flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium focus-visible">
                <i className="fas fa-edit fa-sm"></i>
                <span>Edit Profile</span>
              </button>
              <button className="pwa-button button-glass-secondary hover-lift p-2 rounded-lg focus-visible">
                <i className="fas fa-share-alt"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          className={`grid ${layout.isMobile ? "grid-cols-2" : "grid-cols-4"} gap-4 mb-6`}
        >
          <div className="card-glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {stats.eventsOrganized}
            </div>
            <div className="text-sm text-gray-400">Events Organized</div>
          </div>
          <div className="card-glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {stats.volunteersManaged}
            </div>
            <div className="text-sm text-gray-400">Volunteers Managed</div>
          </div>
          <div className="card-glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {stats.hoursLogged}
            </div>
            <div className="text-sm text-gray-400">Hours Logged</div>
          </div>
          <div className="card-glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {stats.achievements}
            </div>
            <div className="text-sm text-gray-400">Achievements</div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="card-glass rounded-xl overflow-hidden">
          <div className="flex border-b border-gray-700/30">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-all focus-visible ${
                  activeTab === tab.id
                    ? "bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-400"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
                }`}
              >
                <i className={`${tab.icon} fa-sm`}></i>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            name: e.target.value,
                          })
                        }
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            email: e.target.value,
                          })
                        }
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            phone: e.target.value,
                          })
                        }
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Designation
                      </label>
                      <input
                        type="text"
                        value={profileData.designation}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            designation: e.target.value,
                          })
                        }
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        value={profileData.department}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            department: e.target.value,
                          })
                        }
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            location: e.target.value,
                          })
                        }
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) =>
                      setProfileData({ ...profileData, bio: e.target.value })
                    }
                    rows={4}
                    className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    className="pwa-button button-glass-primary hover-lift flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-medium focus-visible"
                  >
                    <i className="fas fa-save fa-sm"></i>
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-3 bg-gray-800/30 rounded-lg"
                      >
                        <div
                          className={`w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center ${activity.color}`}
                        >
                          <i className={`${activity.icon} text-sm`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-200">
                            {activity.action}{" "}
                            <span className="font-medium">{activity.item}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">
                    Activity Chart
                  </h3>
                  <div className="h-64 bg-gray-800/30 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <i className="fas fa-chart-area text-4xl mb-3"></i>
                      <p>Activity chart will be displayed here</p>
                      <p className="text-sm mt-1">
                        Integration with Chart.js coming soon
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">
                    Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">
                          Email Notifications
                        </label>
                        <p className="text-xs text-gray-500">
                          Receive notifications via email
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            emailNotifications: !preferences.emailNotifications,
                          })
                        }
                        className={`toggle-switch ${preferences.emailNotifications ? "active" : ""}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">
                          SMS Notifications
                        </label>
                        <p className="text-xs text-gray-500">
                          Receive notifications via SMS
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            smsNotifications: !preferences.smsNotifications,
                          })
                        }
                        className={`toggle-switch ${preferences.smsNotifications ? "active" : ""}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">
                          Event Reminders
                        </label>
                        <p className="text-xs text-gray-500">
                          Get reminded about upcoming events
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            eventReminders: !preferences.eventReminders,
                          })
                        }
                        className={`toggle-switch ${preferences.eventReminders ? "active" : ""}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-300">
                          Newsletter
                        </label>
                        <p className="text-xs text-gray-500">
                          Receive monthly newsletter
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            newsletter: !preferences.newsletter,
                          })
                        }
                        className={`toggle-switch ${preferences.newsletter ? "active" : ""}`}
                      >
                        <span className="toggle-slider"></span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-4">
                    Display Preferences
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            language: e.target.value,
                          })
                        }
                        className="input-dark w-full text-sm rounded-lg py-2 px-3 focus:outline-none focus-visible"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="ta">Tamil</option>
                        <option value="te">Telugu</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-300">
                            Dark Mode
                          </label>
                          <p className="text-xs text-gray-500">
                            Use dark theme
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setPreferences({
                              ...preferences,
                              darkMode: !preferences.darkMode,
                            })
                          }
                          className={`toggle-switch ${preferences.darkMode ? "active" : ""}`}
                        >
                          <span className="toggle-slider"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    className="pwa-button button-glass-primary hover-lift flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-medium focus-visible"
                  >
                    <i className="fas fa-save fa-sm"></i>
                    <span>Save Preferences</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
