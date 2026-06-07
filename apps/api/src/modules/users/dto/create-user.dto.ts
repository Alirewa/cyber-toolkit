import { IsEmail, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class CreateUserDto {
  @IsEmail({}, { message: "Invalid email address" })
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: "Username can only contain letters, numbers, underscores and hyphens" })
  username!: string;

  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]/, {
    message: "Password must contain uppercase, lowercase, number and special character",
  })
  password!: string;
}
