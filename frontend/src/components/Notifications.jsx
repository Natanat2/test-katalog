import { ToastContainer } from 'react-toastify';

export default function Notifications() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={2400}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme="light"
    />
  );
}
