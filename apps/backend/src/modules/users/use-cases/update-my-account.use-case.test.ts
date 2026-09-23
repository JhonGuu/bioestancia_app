import { describe, expect, it, vi } from "vitest";

import { UpdateMyAccount } from "@/modules/users/use-cases/update-my-account.use-case";
import { UserRepository } from "@/modules/users/domain/user.repository";
import { UserWithCredentials } from "@/modules/users/domain/user";
import { ApiError } from "@/shared/infra/http/api.responses";

function usuario(overrides: Partial<UserWithCredentials> = {}): UserWithCredentials {
  return {
    id: "u1",
    email: "juan@example.com",
    username: "juan",
    passwordHash: "hash-secreto",
    firstName: "Juan",
    lastName: "Aranda",
    phoneNumber: null,
    isActive: true,
    mustChangePassword: false,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function armar(existente: UserWithCredentials | null) {
  const updateProfile = vi.fn(async (_id: string, datos: { firstName: string; lastName: string; phoneNumber: string | null }) =>
    usuario({ ...existente, ...datos }),
  );
  const repo = { getById: vi.fn().mockResolvedValue(existente), updateProfile } as unknown as UserRepository;
  return { useCase: new UpdateMyAccount(repo), updateProfile };
}

describe("UpdateMyAccount", () => {
  it("actualiza nombre, apellido y teléfono sin espacios sobrantes, y no expone el hash", async () => {
    const { useCase, updateProfile } = armar(usuario());

    const resultado = await useCase.execute({
      userId: "u1",
      firstName: "  Juan José ",
      lastName: " Aranda ",
      phoneNumber: " 2644123456 ",
    });

    expect(updateProfile).toHaveBeenCalledWith("u1", {
      firstName: "Juan José",
      lastName: "Aranda",
      phoneNumber: "2644123456",
    });
    expect(resultado.firstName).toBe("Juan José");
    expect(resultado).not.toHaveProperty("passwordHash");
  });

  it("guarda null cuando el teléfono viene vacío o null", async () => {
    const { useCase, updateProfile } = armar(usuario({ phoneNumber: "123" }));

    await useCase.execute({ userId: "u1", firstName: "Juan", lastName: "Aranda", phoneNumber: "   " });
    await useCase.execute({ userId: "u1", firstName: "Juan", lastName: "Aranda", phoneNumber: null });

    expect(updateProfile).toHaveBeenNthCalledWith(1, "u1", expect.objectContaining({ phoneNumber: null }));
    expect(updateProfile).toHaveBeenNthCalledWith(2, "u1", expect.objectContaining({ phoneNumber: null }));
  });

  it("falla con NOT_FOUND si el usuario no existe", async () => {
    const { useCase, updateProfile } = armar(null);

    await expect(
      useCase.execute({ userId: "nope", firstName: "A", lastName: "B", phoneNumber: null }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
