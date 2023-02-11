import { ApplicationError } from "@/protocols";

export function forbiddenError(): ApplicationError {
  return {
    name: "Forbidden",
    message: "Forbidden!",
  };
}