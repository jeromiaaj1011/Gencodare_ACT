import { SecurityService } from "./security";

export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  role: "learner" | "instructor" | "researcher";
  salt: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt?: string;
  institution?: string;
}

class UserStore {
  private users: Map<string, UserAccount> = new Map();

  constructor() {
    this.seedDefaultUsers();
  }

  private seedDefaultUsers() {
    // 1. Default Student
    const salt1 = SecurityService.generateSalt();
    const hash1 = SecurityService.hashPassword("Archaia2026!", salt1);
    this.users.set("student@college.edu", {
      id: "usr_student_01",
      email: "student@college.edu",
      fullName: "Alex Chen",
      role: "learner",
      salt: salt1,
      passwordHash: hash1,
      createdAt: new Date().toISOString(),
      institution: "MIT Department of EECS",
    });

    // 2. Instructor / Lead Diagnostician
    const salt2 = SecurityService.generateSalt();
    const hash2 = SecurityService.hashPassword("AdminRoot#2026", salt2);
    this.users.set("admin@archaia.edu", {
      id: "usr_admin_01",
      email: "admin@archaia.edu",
      fullName: "Prof. Elizabeth Vance",
      role: "instructor",
      salt: salt2,
      passwordHash: hash2,
      createdAt: new Date().toISOString(),
      institution: "ARCHAIA Cognitive Lab",
    });

    // 3. Cognitive AI Researcher
    const salt3 = SecurityService.generateSalt();
    const hash3 = SecurityService.hashPassword("CognitiveSci!2026", salt3);
    this.users.set("researcher@mit.edu", {
      id: "usr_researcher_01",
      email: "researcher@mit.edu",
      fullName: "Dr. Marcus Sterling",
      role: "researcher",
      salt: salt3,
      passwordHash: hash3,
      createdAt: new Date().toISOString(),
      institution: "Center for Brains & Machines",
    });
  }

  public findByEmail(email: string): UserAccount | undefined {
    return this.users.get(email.toLowerCase().trim());
  }

  public createUser(
    email: string,
    plainPassword: string,
    fullName: string,
    role: "learner" | "instructor" | "researcher" = "learner"
  ): { success: boolean; user?: UserAccount; error?: string } {
    const cleanEmail = email.toLowerCase().trim();
    if (this.users.has(cleanEmail)) {
      return { success: false, error: "An account with this email address already exists." };
    }

    const salt = SecurityService.generateSalt();
    const passwordHash = SecurityService.hashPassword(plainPassword, salt);

    const newUser: UserAccount = {
      id: "usr_" + Date.now(),
      email: cleanEmail,
      fullName: fullName.trim(),
      role,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      institution: "Academic Institution",
    };

    this.users.set(cleanEmail, newUser);
    return { success: true, user: newUser };
  }

  public updateLastLogin(email: string): void {
    const user = this.findByEmail(email);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      this.users.set(user.email, user);
    }
  }

  public getPublicProfile(user: UserAccount) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      institution: user.institution,
      lastLoginAt: user.lastLoginAt,
    };
  }
}

// Global singleton instance
const globalForUsers = globalThis as unknown as { archaiaUserStore?: UserStore };
export const userStore = globalForUsers.archaiaUserStore ?? new UserStore();

if (process.env.NODE_ENV !== "production") {
  globalForUsers.archaiaUserStore = userStore;
}
