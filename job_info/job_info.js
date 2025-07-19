// API 관련 상수 정의
const API_URL = 'https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do';
const API_KEY = 'e40097e2-7560-4ead-8bae-8f1c4e17d46f'; // 인증키

// HTML 요소 선택
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const jobList = document.getElementById('jobList');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const regionFilter = document.getElementById('regionFilter'); // 지역 필터링 요소
const pageInfo = document.getElementById('pageInfo');
const currentPageElement = document.getElementById('currentPage');
const totalPagesElement = document.getElementById('totalPages');
const paginationElement = document.querySelector('.paging');  // 이 부분 추가

// 페이지네이션 관련 변수
let currentPage = 1;  // 현재 페이지
const displayCount = 10;  // 한 페이지에 표시할 항목 수
let filteredJobs = [];  // 필터링된 작업 목록

// API에서 채용 정보를 가져오는 비동기 함수
async function fetchJobs() {
    // 로딩 표시 및 에러 메시지 초기화
    loading.style.display = 'block';
    error.style.display = 'none';
    jobList.innerHTML = '';

    const selectedRegion = regionFilter.value; // 선택된 지역
    // API 요청 URL 생성
    const url = `${API_URL}?authKey=${API_KEY}&callTp=L&returnType=XML&startPage=${currentPage}&display=100`; // 최대 100개 요청

    try {
        // API 요청 및 응답 처리
        const response = await fetch(url);
        const textData = await response.text();  // XML 응답을 텍스트로 받음
        console.log("응답 데이터:", textData);  // XML 응답 내용을 확인

        // XML 파싱
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, "application/xml");

        // 응답의 에러 여부 확인
        const messageElement = xmlDoc.getElementsByTagName("message")[0];
        const messageCdElement = xmlDoc.getElementsByTagName("messageCd")[0];

        if (messageElement) {
            const message = messageElement.textContent;
            const messageCd = messageCdElement ? messageCdElement.textContent : "코드를 찾을 수 없습니다.";
            throw new Error(`오류 메시지: ${message} (코드: ${messageCd})`);
        }

        // 채용 정보 추출
        const jobs = xmlDoc.getElementsByTagName("wanted");

        if (jobs.length === 0) {
            throw new Error("채용 정보가 없습니다.");
        }

        // 선택된 지역으로 필터링
        filteredJobs = Array.from(jobs).filter(job => {
            const region = job.getElementsByTagName("region")[0]?.textContent || '';
            return selectedRegion === '' || region.includes(selectedRegion); // 전체 또는 선택된 지역에 포함
        });

        // 페이지 정보 초기화
        currentPage = 1;  // 현재 페이지를 1로 리셋
        const totalPages = Math.ceil(filteredJobs.length / displayCount);
        currentPageElement.textContent = currentPage;
        totalPagesElement.textContent = totalPages;

        // 페이지네이션 처리 및 화면에 표시
        renderJobs();

    } catch (err) {
        // 에러 처리
        console.error('Error:', err);
        error.textContent = '채용 정보를 불러오는 데 실패했습니다: ' + err.message;
        error.style.display = 'block';
    } finally {
        // 로딩 표시 제거
        loading.style.display = 'none';
    }
}

// 채용 정보를 화면에 표시하는 함수
function renderJobs() {
    const startIndex = (currentPage - 1) * displayCount;
    const endIndex = startIndex + displayCount;
    const jobsToDisplay = filteredJobs.slice(startIndex, endIndex);

    jobList.innerHTML = jobsToDisplay.map(job => {
        // XML 데이터에서 필요한 정보 추출
        const title = job.getElementsByTagName("title")[0]?.textContent || '제목 없음';
        const company = job.getElementsByTagName("company")[0]?.textContent || '회사명 없음';
        const region = job.getElementsByTagName("region")[0]?.textContent || '지역 정보 없음';
        const salary = job.getElementsByTagName("sal")[0]?.textContent || '급여 정보 없음';
        const employType = job.getElementsByTagName("holidayTpNm")[0]?.textContent || '고용형태 정보 없음';
        const wantedAuthNo = job.getElementsByTagName("wantedAuthNo")[0]?.textContent || '';
        const url = `https://www.work.go.kr/empInfo/empInfoSrch/detail/empDetailAuthView.do?wantedAuthNo=${wantedAuthNo}`;

        return `
            <li class="bg-gray-50 rounded-xl shadow-md p-6 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-lg">
                <div class="space-y-3">
                    <h3 class="text-xl font-semibold text-gray-700">${company}</h3>
                    <div class="space-y-2 text-gray-600">
                        <p><span class="font-medium">채용제목:</span> ${title}</p>
                        <p><span class="font-medium">지역:</span> ${region}</p>
                        <p><span class="font-medium">급여:</span> ${salary}</p>
                        <p><span class="font-medium">고용형태:</span> ${employType}</p>
                    </div>
                    <div class="pt-3 flex justify-center">
                        <a href="${url}" target="_blank" 
                           class="inline-block bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200">
                            상세보기
                        </a>
                    </div>
                </div>
            </li>
        `;
    }).join('');

    // 페이지 정보 업데이트
    currentPageElement.textContent = currentPage;
    totalPagesElement.textContent = Math.ceil(filteredJobs.length / displayCount);

    // 페이지네이션 업데이트
    setupPagination();
}

// 이전 페이지 버튼 클릭 이벤트 처리
prevPageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    changePage(currentPage - 1);
});

// 다음 페이지 버튼 클릭 이벤트 처리
nextPageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    changePage(currentPage + 1);
});

// 지역 필터링 변경 이벤트 처리
regionFilter.addEventListener('change', () => {
    currentPage = 1;  // 페이지를 첫 페이지로 리셋
    fetchJobs();  // 작업 목록 새로 고침
});

// 초기 데이터 로드
fetchJobs();

function setupPagination() {
    const totalPages = Math.ceil(filteredJobs.length / displayCount);

    paginationElement.innerHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} 
                onclick="changePage(${currentPage - 1})" 
                class="btn_page prev bg-gray-50 rounded-lg px-6 py-2 text-gray-700 font-medium ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">
            이전
        </button>
        <div class="page_num text-gray-700">
            <strong id="currentPage" class="text-blue-600">${currentPage}</strong> / <span id="totalPages">${totalPages}</span>
        </div>
        <button ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="changePage(${currentPage + 1})" 
                class="btn_page next bg-gray-50 rounded-lg px-6 py-2 text-gray-700 font-medium ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">
            다음
        </button>
    `;
}

// 페이지 변경 함수
function changePage(page) {
    if (page >= 1 && page <= Math.ceil(filteredJobs.length / displayCount)) {
        currentPage = page;
        renderJobs();
        window.scrollTo(0, 0);
    }
}
