export function SubmitButton({ loading, loadingLabel, label, ...rest }) {
  return (
    <button
      type="submit"
      className="btn btn-primary btn-login-submit"
      disabled={loading}
      {...rest}
    >
      {loading ? loadingLabel : label}
    </button>
  )
}

