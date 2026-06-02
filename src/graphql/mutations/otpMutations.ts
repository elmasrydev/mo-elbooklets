export const SEND_MOBILE_OTP_MUTATION = `
  mutation SendMobileOtp($mobile: String!, $country_code: String) {
    sendMobileOtp(mobile: $mobile, country_code: $country_code) {
      success
      message
      expires_in
    }
  }
`;

export const VERIFY_MOBILE_OTP_MUTATION = `
  mutation VerifyMobileOtp($otp: String!) {
    verifyMobileOtp(otp: $otp) {
      success
      message
      user {
        id name email mobile country_code mobile_verified_at
        gender school_name parent_mobile
        grade_id grade { id name }
        educational_system_id educational_system { id name }
        governorate_id governorate { id name_ar name_en }
        city_id city { id name_ar name_en }
        is_subscribed
      }
    }
  }
`;
