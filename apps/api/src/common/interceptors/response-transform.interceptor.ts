import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: unknown;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If handler already returns the envelope shape, pass through
        if (data && typeof data === "object" && "success" in (data as object)) {
          return data as unknown as ApiSuccessResponse<T>;
        }

        // Unwrap { data, message, meta } pattern from services
        if (data && typeof data === "object" && "data" in (data as object)) {
          const d = data as unknown as { data: T; message?: string; meta?: unknown };
          return {
            success: true,
            data: d.data,
            message: d.message ?? "Success",
            ...(d.meta ? { meta: d.meta } : {}),
          };
        }

        return {
          success: true,
          data: data as T,
          message: "Success",
        };
      })
    );
  }
}
