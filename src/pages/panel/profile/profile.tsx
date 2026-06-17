import { useState } from "react";
import LocalStorageService from "@/services/localstorage";
import useConvertCountry from "@/hooks/useConvertCountry";
import { useProfileEdit } from "@/hooks/useProfileEdit";
import { useSubprofiles } from "@/hooks/useSubprofiles";
import { useChangePassword } from "@/hooks/useChangePassword";
import { ProfileHeroCard } from "@/components/profile/ProfileHeroCard";
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { SubprofilesCard } from "@/components/profile/SubprofilesCard";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import type { ActiveSection, ProfileUserData, EditProfileForm } from "@/types/profile.types";
import type { RegisterSubuserSchema } from "@/types";

const ProfilePage = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);

  const isMainUser = (() => {
    const u = LocalStorageService.getItem("user");
    return !u?.parentUserId;
  })();

  const [userData, setUserData] = useState<ProfileUserData>(() => {
    const u = LocalStorageService.getItem("user");
    return {
      username: u.username ?? "",
      name: u.name ?? "",
      lastName: u.lastName ?? "",
      email: u.email ?? "",
      userId: u.id ?? u._id ?? "",
      onboardingData: {
        country: u.onboardingData?.country ?? null,
        address: u.onboardingData?.address ?? null,
        profession: u.onboardingData?.profession ?? null,
        otherProfession: u.onboardingData?.otherProfession ?? null,
      },
    };
  });

  const convertCountry = useConvertCountry(userData.onboardingData.country);

  const profileEdit = useProfileEdit(userData, (patch) => {
    setUserData((prev) => ({
      ...prev,
      onboardingData: { ...prev.onboardingData, ...patch },
    }));
    setTimeout(() => setActiveSection(null), 1500);
  });

  const subprofiles = useSubprofiles(userData.userId);

  const changePassword = useChangePassword(() => setActiveSection(null));

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(userData.userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleSection = (section: ActiveSection) =>
    setActiveSection((prev) => (prev === section ? null : section));

  return (
    <div className="min-h-screen bg-[#F7F8FA] px-10 py-8">
      <div style={{ maxWidth: 680 }}>
        <div className="flex flex-col gap-1.5 mb-6">
          <h1 className="text-2xl font-bold text-[#111827]">Mi Perfil</h1>
          <div className="w-10 h-0.5 rounded-full bg-[#F97316]" />
        </div>

        <div className="flex flex-col gap-4">
          <ProfileHeroCard
            userData={userData}
            convertCountry={convertCountry}
            profileImage={profileImage}
            isEditing={activeSection === "edit-profile"}
            editForm={profileEdit.editForm}
            editErrors={profileEdit.editErrors}
            editLoading={profileEdit.editLoading}
            editError={profileEdit.editError}
            editSuccess={profileEdit.editSuccess}
            onImageChange={handleImageChange}
            onToggleEdit={() => toggleSection("edit-profile")}
            onEditFormChange={(field: keyof EditProfileForm, value: string) =>
              profileEdit.setEditForm((prev) => ({ ...prev, [field]: value }))
            }
            onSaveProfile={profileEdit.handleSaveProfile}
          />

          <ProfileInfoCard
            userData={userData}
            copied={copied}
            onCopyId={handleCopyId}
          />

          <SubprofilesCard
            isMainUser={isMainUser}
            subprofiles={subprofiles.subprofiles}
            subLoading={subprofiles.subLoading}
            subError={subprofiles.subError}
            unlinkingId={subprofiles.unlinkingId}
            confirmingId={subprofiles.confirmingId}
            unlinkSuccess={subprofiles.unlinkSuccess}
            isCreating={activeSection === "create-subprofile"}
            createForm={subprofiles.createForm}
            createErrors={subprofiles.createErrors}
            createLoading={subprofiles.createLoading}
            createError={subprofiles.createError}
            createSuccess={subprofiles.createSuccess}
            onReload={() => void subprofiles.loadSubprofiles()}
            onToggleCreate={() => toggleSection("create-subprofile")}
            onCreateFormChange={(field: keyof RegisterSubuserSchema, value: string) =>
              subprofiles.setCreateForm((prev) => ({ ...prev, [field]: value }))
            }
            onCreateSubmit={(e) => void subprofiles.handleCreateSubprofile(e, () => setActiveSection(null))}
            onConfirmUnlink={subprofiles.setConfirmingId}
            onCancelUnlink={() => subprofiles.setConfirmingId(null)}
            onUnlink={(id) => void subprofiles.handleUnlink(id)}
          />

          <ChangePasswordCard
            isOpen={activeSection === "change-password"}
            pwdForm={changePassword.pwdForm}
            pwdShow={changePassword.pwdShow}
            pwdError={changePassword.pwdError}
            pwdSuccess={changePassword.pwdSuccess}
            pwdLoading={changePassword.pwdLoading}
            onToggle={() => toggleSection("change-password")}
            onFormChange={(field, value) =>
              changePassword.setPwdForm((prev) => ({ ...prev, [field]: value }))
            }
            onToggleShow={(field) =>
              changePassword.setPwdShow((prev) => ({ ...prev, [field]: !prev[field] }))
            }
            onSubmit={changePassword.handleChangePassword}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
