import type { ValidationError } from "class-validator";

interface FormattedError {
  property: string;
  value: any;
  errors: string[];
}

export function formatValidationErrors(
  validationErrors: ValidationError[],
  parent?: ValidationError,
): FormattedError[] {
  return validationErrors
    .map(error => {
      if (error.children?.length) {
        return formatValidationErrors(error.children, error);
      }

      return {
        property: parent
          ? `${parent.property}.${error.property}`
          : error.property,
        value: error.value,
        errors: error.constraints ? Object.values(error.constraints) : [],
      };
    })
    .flat(Number.POSITIVE_INFINITY) as FormattedError[];
}
