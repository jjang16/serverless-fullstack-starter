import React from 'react'
import { useAsyncCallback } from '@hooks/use-async-callback'
import {
  useSynchronousState,
  ObjectFieldEditor,
} from '@hooks/use-synchronous-state'
import type {
  FormValidator,
  FormSanitizer,
  FormErrors,
  FormHelperTexts,
  FormFieldKey,
  FormFieldKeys,
  FormFieldInput,
  PartialEntries,
} from './types'
import { useGetter } from '@hooks/use-getter'

interface UseFormProps<
  FormInput,
  ValidationErrorCode extends string,
  SubmitInput,
  SubmitResult,
> {
  validator: FormValidator<FormInput, ValidationErrorCode>
  sanitizer: FormSanitizer<FormInput, SubmitInput>
  defaultContent: FormInput
  canSubmitDefault?: boolean
  submit: (fieldsContent: SubmitInput) => PromiseLike<SubmitResult>
  computeChangeDiff?: (
    currentContent: FormInput,
    defaultContent: FormInput,
  ) => boolean
  errorMessages: Record<ValidationErrorCode, string>
}

export const useForm = <
  FormInput extends object,
  ValidationErrorCode extends string,
  SubmitInput = FormInput,
  SubmitResult = any,
>({
  validator,
  sanitizer,
  defaultContent,
  canSubmitDefault = false,
  submit,
  computeChangeDiff,
  errorMessages,
}: UseFormProps<FormInput, ValidationErrorCode, SubmitInput, SubmitResult>): {
  // return type
  hasSubmitted: boolean
  canSubmit: boolean
  validationPassed: boolean
  hasChanged: boolean
  cannotSubmitBecauseHasNotChanged: boolean
  errors: FormErrors<FormInput, ValidationErrorCode>
  helperTexts: FormHelperTexts<FormInput>
  setContent: ObjectFieldEditor<FormInput>
  content: FormInput
  submit: (e?: React.FormEvent<HTMLFormElement>) => void
  getOnFieldChange: (
    fieldName: FormFieldKey<FormInput>,
    defaultValue?: FormFieldInput<FormInput>,
  ) => (value?: FormFieldInput<FormInput>) => void // not necessarily needed
} => {
  const [contentBox, , setContent] = useSynchronousState<FormInput>(
    defaultContent,
    true,
  )
  const content = contentBox.current

  const [hasSubmitted, setHasSubmitted] = React.useState(false)
  const isSubmittingBox = React.useRef(false)

  const hasChanged = React.useMemo(() => {
    if (computeChangeDiff) {
      return computeChangeDiff(content, defaultContent)
    }
    let hasChanged = false
    ;(Object.keys(defaultContent) as FormFieldKeys<FormInput>).forEach(
      (key) => {
        if (content[key] !== defaultContent[key]) {
          hasChanged = true
        }
      },
    )
    return hasChanged
  }, [content, defaultContent, computeChangeDiff])

  const validationPassed = React.useMemo(() => {
    const validatResult = validator(content)
    if (!validatResult) return true

    let validatePass = true
    Object.values(validatResult).forEach((fieldValidateResult) => {
      if (fieldValidateResult) {
        validatePass = false
      }
    })

    return validatePass
  }, [content, validator])

  const [canSubmit, cannotSubmitBecauseHasNotChanged] = React.useMemo(() => {
    // validation passed has priority
    if (!validationPassed) {
      return [validationPassed, false]
    }

    // then, check for change
    if (!canSubmitDefault) {
      if (!hasChanged) {
        return [false, true]
      }
    }

    return [validationPassed, false]
  }, [validationPassed, canSubmitDefault, hasChanged])

  const errors = React.useMemo(() => {
    const validateResult = validator(content)
    const errObject: FormErrors<FormInput, ValidationErrorCode> = {}
    if (validateResult) {
      ;(
        Object.entries(validateResult) as PartialEntries<
          FormErrors<FormInput, ValidationErrorCode>
        >
      ).forEach(([k, v]) => {
        if (hasSubmitted || content[k]) {
          errObject[k] = v
        }
      })
    }
    return errObject
  }, [hasSubmitted, content, validator])

  const helperTexts = React.useMemo(() => {
    const result: FormHelperTexts<FormInput> = {}
    ;(
      Object.entries(errors) as PartialEntries<
        FormErrors<FormInput, ValidationErrorCode>
      >
    ).forEach(([k, v]) => {
      if (v) {
        result[k] = errorMessages[v]
      }
    })
    return result
  }, [errors, errorMessages])

  const getOnFieldChange = React.useCallback(
    (
      fieldName: FormFieldKey<FormInput>,
      defaultValue?: FormFieldInput<FormInput>,
    ) => {
      return (value?: FormFieldInput<FormInput>) => {
        if (typeof defaultValue === `undefined`) {
          setContent(fieldName, value)
        } else {
          setContent(fieldName, defaultValue)
        }
      }
    },
    [setContent],
  )

  const getSanitizer = useGetter(sanitizer)
  const getSubmit = useGetter(submit)
  const onSubmit = useAsyncCallback(
    async (e?: React.FormEvent<HTMLFormElement>) => {
      if (e) {
        e.preventDefault()
      }

      if (isSubmittingBox.current) {
        // check lock
        return
      }
      isSubmittingBox.current = true // lock

      setHasSubmitted(true)

      if (!canSubmit) {
        return
      }

      const sanitizedContent = getSanitizer()(content)
      const result = await getSubmit()(sanitizedContent)
      isSubmittingBox.current = false // unlock
      return result
    },
    [getSanitizer, content, canSubmit, getSubmit],
  )

  return {
    hasSubmitted,
    hasChanged,
    canSubmit,
    cannotSubmitBecauseHasNotChanged,
    validationPassed,
    errors,
    helperTexts,
    setContent,
    content,
    submit: onSubmit,
    getOnFieldChange, // not necessarily needed
  }
}
