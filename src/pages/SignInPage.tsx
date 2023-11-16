import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSignInStore } from '../stores/useSignInStore'
import { AxiosError } from 'axios'
import { FormError, hasError, validator } from '../utils/validator'
import { FormEventHandler } from 'react'
import { useAjax } from '../utils/ajax'
import { Gradient } from '../components/Gradient'
import { Icon } from '../components/Icon'
import { Input } from '../components/Input'
import { TopNav } from '../components/TopNav'

export const SignInPage: React.FC = () => {
  const { data, error, setData, setError } = useSignInStore()
  const nav = useNavigate()
  const { post } = useAjax({ showLoading: true })
  const onSubmitError = (err: AxiosError<{ errors: FormError<typeof data> }>) => {
    setError(err.response?.data?.errors ?? {})
    throw error
  }
  const [search] = useSearchParams()
  const onSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    const newError = validator(data, [
      { key: 'email', type: 'required', message: '请输入邮箱地址' },
      { key: 'email', type: 'pattern', regex: /^.+@.+$/, message: '邮箱地址格式不正确' },
      { key: 'code', type: 'required', message: '请输入验证码' },
      { key: 'code', type: 'length', min: 6, max: 6, message: '验证码必须是6个字符' },
    ])
    setError(newError)
    if (!hasError(newError)) {
      const response = await post<{ token: string }>('/login', {"email": data.email, "verification_code": data.code})
        .catch(onSubmitError)
      const jwt = response.data.token
      localStorage.setItem('jwt', jwt)
      const from = search.get('from') || '/'
      nav(from)
    }
  }
  const sendSmsCode = async () => {
    const newError = validator({ email: data.email }, [
      { key: 'email', type: 'pattern', regex: /^.+@.+$/, message: '邮箱地址格式不正确' }
    ])
    setError(newError)
    if (hasError(newError)) { throw new Error('表单出错') }
    const response = await post('/sendVerificationCode', {
      email: data.email
    })
    return response
  }
  return (
    <>
      <Gradient>
        <TopNav title="登录" icon={<Icon name="back" />} />
      </Gradient>
      <div text-center pt-40px pb-16px>
        <Icon name="logo" className='w-64px h-68px' />
        <h1 text-32px text="#7878FF" font-bold>山竹记账</h1>
      </div>
      <form j-form onSubmit={onSubmit}>
        <Input label='邮箱地址' placeholder='请输入邮箱，然后点击发送验证码'
          value={data.email} onChange={email => setData({ email })}
          error={error.email?.[0]} />
        <Input label='验证码' type="sms_code" placeholder='六位数字' value={data.code}
          onChange={value => setData({ code: value })}
          error={error.code?.[0]} request={sendSmsCode} />
        <div mt-100px>
          <button j-btn type="submit">登录</button>
        </div>
      </form>
    </>
  )
}
